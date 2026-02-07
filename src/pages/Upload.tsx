import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, FileText, Type, Loader2, Upload as UploadIcon, Sparkles, Check, X, BookOpen, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type UploadMethod = 'camera' | 'file' | 'text';

interface GeneratedContent {
  summary: string;
  flashcards: { front: string; back: string }[];
  questions: { question: string; options: string[]; correct_answer: string; explanation: string }[];
}

const Upload = () => {
  const [method, setMethod] = useState<UploadMethod>('camera');
  const [text, setText] = useState('');
  const [topicName, setTopicName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setImagePreview(null);
      }
      
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!topicName) {
        setTopicName(fileName);
      }
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capturedFile = e.target.files?.[0];
    if (capturedFile) {
      setFile(capturedFile);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(capturedFile);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    let contentText = text;
    let imageBase64: string | null = null;
    let mimeType: string | null = null;
    
    if (method === 'file' || method === 'camera') {
      if (!file) {
        toast.error('Please select a file first');
        return;
      }
      
      if (file.type.startsWith('image/')) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type;
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        contentText = await file.text();
      } else {
        try {
          contentText = await file.text();
        } catch {
          toast.error('Could not read file. Please try an image or text file.');
          return;
        }
      }
    }

    if (!contentText.trim() && !imageBase64) {
      toast.error('Please provide some content to process');
      return;
    }

    if (!topicName.trim()) {
      toast.error('Please provide a topic name');
      return;
    }

    setProcessing(true);

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        toast.error('Please sign in to continue');
        setProcessing(false);
        return;
      }

      console.log("Sending to edge function:", {
        hasContent: !!contentText,
        contentLength: contentText?.length || 0,
        hasImage: !!imageBase64,
        imageLength: imageBase64?.length || 0,
        mimeType
      });

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { 
          content: contentText, 
          imageBase64,
          mimeType 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        
        if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          toast.error('Authentication failed. Please sign in again.');
        } else if (error.message?.includes('GOOGLE_AI_API_KEY')) {
          toast.error('Google AI API key not configured. Please add GOOGLE_AI_API_KEY secret.');
        } else {
          toast.error('Failed to generate content. Please try again.');
        }
        return;
      }

      if (!data || typeof data !== 'object') {
        toast.error('Invalid response from server');
        console.error('Invalid data:', data);
        return;
      }

      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Authentication error');
        return;
      }

      // Create topic
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .insert({ name: topicName.trim(), user_id: user.id })
        .select()
        .single();

      if (topicError) {
        console.error('Error creating topic:', topicError);
        toast.error('Failed to create topic');
        return;
      }

      // Save content upload
      await supabase.from('content_uploads').insert({
        user_id: user.id,
        topic_id: topic.id,
        file_name: file?.name || 'Text Input',
        file_type: file?.type || 'text/plain',
        summary: data.summary,
        extracted_text: data.extractedText || contentText,
        processed: true,
      });

      // Save flashcards
      if (data.flashcards?.length > 0) {
        await supabase.from('flashcards').insert(
          data.flashcards.map((f: { front: string; back: string }) => ({
            front: f.front,
            back: f.back,
            topic_id: topic.id,
            user_id: user.id,
          }))
        );
      }

      // Save questions
      if (data.questions?.length > 0) {
        await supabase.from('questions').insert(
          data.questions.map((q: { question: string; options: string[]; correct_answer: string; explanation: string }) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            topic_id: topic.id,
            user_id: user.id,
          }))
        );
      }

      setGeneratedContent({
        summary: data.summary,
        flashcards: data.flashcards || [],
        questions: data.questions || [],
      });

      toast.success(`Generated ${data.flashcards?.length || 0} flashcards and ${data.questions?.length || 0} questions!`);
      
      // Reset form
      setText('');
      setFile(null);
      setImagePreview(null);
      setTopicName('');
    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Failed to process content. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Upload Content</h1>
          <p className="text-muted-foreground">
            Upload your study materials and let AI generate flashcards and practice questions.
          </p>
        </div>

        {/* Upload Method Selection */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => setMethod('camera')}
            className={cn(
              "flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl border-2 transition-all",
              method === 'camera'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="font-medium text-sm sm:text-base">Camera</span>
          </button>
          <button
            onClick={() => setMethod('file')}
            className={cn(
              "flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl border-2 transition-all",
              method === 'file'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="font-medium text-sm sm:text-base">File</span>
          </button>
          <button
            onClick={() => setMethod('text')}
            className={cn(
              "flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl border-2 transition-all",
              method === 'text'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <Type className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="font-medium text-sm sm:text-base">Text</span>
          </button>
        </div>

        {/* Content Input */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            {method === 'camera' && (
              <div className="space-y-4">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Captured" 
                      className="w-full rounded-lg max-h-64 object-contain bg-muted"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={clearFile}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Retake
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm">
                      <Check className="w-4 h-4" />
                      Photo ready for OCR
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-40 border-dashed flex flex-col gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-10 h-10 text-muted-foreground" />
                    <span>Tap to take a photo</span>
                    <span className="text-xs text-muted-foreground">AI will extract text automatically</span>
                  </Button>
                )}
              </div>
            )}

            {method === 'file' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Uploaded" 
                          className="w-full rounded-lg max-h-64 object-contain bg-muted"
                        />
                        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm">
                          <Check className="w-4 h-4" />
                          Ready for OCR
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFile}
                      className="w-full"
                    >
                      Choose different file
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-40 border-dashed flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="w-10 h-10 text-muted-foreground" />
                    <span>Tap to upload file</span>
                    <span className="text-xs text-muted-foreground">PDF, DOC, TXT, or Image</span>
                  </Button>
                )}
              </div>
            )}

            {method === 'text' && (
              <div className="space-y-3">
                <Label>Paste your study content</Label>
                <Textarea
                  placeholder="Paste your notes, textbook content, or any study material here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px] text-base"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic Name */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <Label className="mb-2 block">Topic Name</Label>
            <Input
              placeholder="Enter a name for this topic..."
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          size="lg" 
          className="w-full h-14 text-lg"
          onClick={handleSubmit}
          disabled={processing || (!text.trim() && !file)}
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Study Materials
            </>
          )}
        </Button>

        {/* Generated Content Display */}
        {generatedContent && (
          <div className="mt-8 space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{generatedContent.summary}</p>
              </CardContent>
            </Card>

            {/* Flashcards Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Flashcards ({generatedContent.flashcards.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {generatedContent.flashcards.slice(0, 3).map((card, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-1">{card.front}</p>
                      <p className="text-sm text-muted-foreground">{card.back}</p>
                    </div>
                  ))}
                  {generatedContent.flashcards.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{generatedContent.flashcards.length - 3} more flashcards
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Questions Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Practice Questions ({generatedContent.questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {generatedContent.questions.slice(0, 2).map((q, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">{q.question}</p>
                      <ul className="space-y-1">
                        {q.options.map((opt, j) => (
                          <li key={j} className={cn(
                            "text-sm pl-2",
                            opt === q.correct_answer ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {generatedContent.questions.length > 2 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{generatedContent.questions.length - 2} more questions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
