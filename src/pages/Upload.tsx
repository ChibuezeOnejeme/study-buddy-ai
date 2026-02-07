import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, FileText, Type, Loader2, Upload as UploadIcon, Sparkles, Check, X } from 'lucide-react';
import { useTopics, useCreateTopic } from '@/hooks/useTopics';
import { useBulkCreateFlashcards } from '@/hooks/useFlashcards';
import { useBulkCreateQuestions } from '@/hooks/useQuestions';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useGamification } from '@/hooks/useGamification';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { UsageLimitBanner } from '@/components/subscription/UsageLimitBanner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { showXPGainToast } from '@/components/gamification/AchievementToast';

type UploadMethod = 'camera' | 'file' | 'text';

const Upload = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(searchParams.get('welcome') === 'true');
  const [method, setMethod] = useState<UploadMethod>('camera');
  const [text, setText] = useState('');
  const [topicName, setTopicName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clear welcome param from URL after showing
  useEffect(() => {
    if (showWelcome) {
      searchParams.delete('welcome');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const { data: topics = [] } = useTopics();
  const createTopic = useCreateTopic();
  const bulkCreateFlashcards = useBulkCreateFlashcards();
  const bulkCreateQuestions = useBulkCreateQuestions();
  const { uploadsUsed, uploadsRemaining, canUpload, incrementUpload } = useUsageLimits();
  const { awardXP, recordActivity } = useGamification();
  const { unlockFeature } = useFeatureUnlock();
  const uploadLimit = uploadsRemaining === Infinity ? Infinity : uploadsRemaining + uploadsUsed;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setImagePreview(null);
      }
      
      // Try to extract text from the file name for topic suggestion
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
      
      // Create preview
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
        // Extract base64 data after the comma
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    // Check usage limits
    if (!canUpload) {
      toast.error('Weekly upload limit reached. Upgrade for unlimited uploads!');
      return;
    }
    
    let contentText = text;
    let imageBase64: string | null = null;
    let mimeType: string | null = null;
    
    // Get content based on method
    if (method === 'file' || method === 'camera') {
      if (!file) {
        toast.error('Please select a file first');
        return;
      }
      
      // Handle images with OCR
      if (file.type.startsWith('image/')) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type;
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        contentText = await file.text();
      } else {
        // For other file types, try to read as text
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

    if (!topicName.trim() && !selectedTopic) {
      toast.error('Please provide a topic name or select an existing topic');
      return;
    }

    setProcessing(true);

    try {
      // Create topic if new
      let topicId = selectedTopic;
      if (!selectedTopic && topicName.trim()) {
        const newTopic = await createTopic.mutateAsync({ name: topicName.trim() });
        topicId = newTopic.id;
      }

      // Call AI to generate flashcards and questions
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { 
          content: contentText, 
          topicId,
          imageBase64,
          mimeType 
        },
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('Usage limit reached. Please add credits to continue.');
        } else {
          throw error;
        }
        return;
      }

      // Save content upload record with summary
      const { error: uploadError } = await supabase
        .from('content_uploads')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          topic_id: topicId,
          file_name: file?.name || 'Text Input',
          file_type: file?.type || 'text/plain',
          extracted_text: data.extractedText || contentText,
          summary: data.summary,
          flashcard_count: data.flashcards?.length || 0,
          question_count: data.questions?.length || 0,
          processed: true,
        });

      if (uploadError) {
        console.error('Error saving content upload:', uploadError);
      }

      // Save generated flashcards
      if (data.flashcards?.length > 0) {
        await bulkCreateFlashcards.mutateAsync(
          data.flashcards.map((f: { front: string; back: string }) => ({
            front: f.front,
            back: f.back,
            topic_id: topicId,
          }))
        );
      }

      if (data.questions?.length > 0) {
        await bulkCreateQuestions.mutateAsync(
          data.questions.map((q: { question: string; options: string[]; correct_answer: string; explanation: string }) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            topic_id: topicId,
          }))
        );
      }

      // Increment upload count, unlock feature, and award XP
      await incrementUpload();
      await unlockFeature('first_upload_completed');
      setShowWelcome(false); // Dismiss welcome banner after first upload
      
      const result = await awardXP({ eventType: 'practice_session', metadata: { type: 'upload' } });
      showXPGainToast({ amount: result.xpAwarded, eventType: 'practice_session' });
      await recordActivity();

      toast.success(`Generated ${data.flashcards?.length || 0} flashcards and ${data.questions?.length || 0} questions!`);
      
      // Reset form
      setText('');
      setFile(null);
      setImagePreview(null);
      setTopicName('');
      setSelectedTopic('');
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
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-32">
        {/* Welcome Banner for first-time users */}
        {showWelcome && (
          <div className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground mb-6 relative">
            <button 
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-display text-2xl font-bold mb-2">Welcome to Learnorita! 🎉</h2>
            <p className="text-primary-foreground/80">
              Start by uploading your study material. Snap a photo, upload a file, or paste text — 
              AI will generate summaries, flashcards and practice questions. Content is stored for 60 days.
            </p>
          </div>
        )}

        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Upload Content</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          Upload your study materials and let AI generate flashcards and practice questions.
        </p>
        
        {/* Usage Limit Banner */}
        <UsageLimitBanner 
          type="uploads" 
          used={uploadsUsed} 
          limit={uploadLimit} 
          className="mb-6"
        />

        {/* Upload Method Selection - Mobile optimized */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <button
            onClick={() => setMethod('camera')}
            className={cn(
              "flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all",
              method === 'camera'
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            )}
          >
            <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="font-medium text-xs sm:text-base">Camera</span>
          </button>
          <button
            onClick={() => setMethod('file')}
            className={cn(
              "flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all",
              method === 'file'
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            )}
          >
            <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="font-medium text-xs sm:text-base">File</span>
          </button>
          <button
            onClick={() => setMethod('text')}
            className={cn(
              "flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all",
              method === 'text'
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            )}
          >
            <Type className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="font-medium text-xs sm:text-base">Text</span>
          </button>
        </div>

        {/* Content Input - Mobile optimized */}
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 mb-4 sm:mb-6">
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
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      Retake
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-accent/90 text-accent-foreground px-3 py-1 rounded-full text-sm">
                    <Check className="w-4 h-4" />
                    Photo ready for OCR
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-32 sm:h-40 border-dashed flex flex-col gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                  <span className="text-sm sm:text-base">Tap to take a photo</span>
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
                      <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-accent/90 text-accent-foreground px-3 py-1 rounded-full text-sm">
                        <Check className="w-4 h-4" />
                        Ready for OCR
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                      <FileText className="w-8 h-8 text-accent" />
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
                  className="w-full h-32 sm:h-40 border-dashed flex flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                  <span className="text-sm sm:text-base">Tap to upload file</span>
                  <span className="text-xs text-muted-foreground">PDF, DOC, TXT, or Image</span>
                </Button>
              )}
            </div>
          )}

          {method === 'text' && (
            <div className="space-y-3">
              <Label className="text-sm sm:text-base">Paste your study content</Label>
              <Textarea
                placeholder="Paste your notes, textbook content, or any study material here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[150px] sm:min-h-[200px] text-base"
              />
            </div>
          )}
        </div>

        {/* Topic Selection - Mobile optimized */}
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 mb-6 space-y-3 sm:space-y-4">
          <Label className="text-sm sm:text-base">Topic</Label>
          <div className="space-y-3">
            <Input
              placeholder="Create new topic..."
              value={topicName}
              onChange={(e) => {
                setTopicName(e.target.value);
                setSelectedTopic('');
              }}
              className="text-base h-12"
            />
            {topics.length > 0 && (
              <Select 
                value={selectedTopic} 
                onValueChange={(value) => {
                  setSelectedTopic(value);
                  setTopicName('');
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Or select existing topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Submit Button - Fixed above bottom nav on mobile */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-40 lg:hidden">
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full h-14 shadow-lg"
            onClick={handleSubmit}
            disabled={processing || (!text.trim() && !file)}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Study Materials</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Desktop submit button */}
        <div className="hidden lg:block">
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full h-14"
            onClick={handleSubmit}
            disabled={processing || (!text.trim() && !file)}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Study Materials</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
