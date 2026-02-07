import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, FileText, Type, Loader2, Upload as UploadIcon, Sparkles, Check, Clock } from 'lucide-react';
import { useTopics, useCreateTopic } from '@/hooks/useTopics';
import { useBulkCreateFlashcards } from '@/hooks/useFlashcards';
import { useBulkCreateQuestions } from '@/hooks/useQuestions';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useGamification } from '@/hooks/useGamification';
import { useFeatureUnlock } from '@/hooks/useFeatureUnlock';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { showXPGainToast } from '@/components/gamification/AchievementToast';

type UploadMethod = 'camera' | 'file' | 'text';
type ProcessingStep = 'idle' | 'creating_topic' | 'generating' | 'saving_upload' | 'saving_flashcards' | 'saving_questions' | 'finalizing';

const STEP_MESSAGES: Record<ProcessingStep, string> = {
  idle: '',
  creating_topic: 'Creating topic...',
  generating: 'AI is extracting content... (~15-30s)',
  saving_upload: 'Saving document...',
  saving_flashcards: 'Saving flashcards...',
  saving_questions: 'Saving questions...',
  finalizing: 'Finalizing...',
};

export function NewUserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [method, setMethod] = useState<UploadMethod>('camera');
  const [text, setText] = useState('');
  const [topicName, setTopicName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: topics = [] } = useTopics();
  const createTopic = useCreateTopic();
  const bulkCreateFlashcards = useBulkCreateFlashcards();
  const bulkCreateQuestions = useBulkCreateQuestions();
  const { canUpload, incrementUpload } = useUsageLimits();
  const { awardXP, recordActivity } = useGamification();
  const { unlockFeature } = useFeatureUnlock();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setImagePreview(null);
      }
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      if (!topicName) setTopicName(fileName);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capturedFile = e.target.files?.[0];
    if (capturedFile) {
      setFile(capturedFile);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
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

  const clearFile = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to upload content');
      return;
    }

    if (!canUpload) {
      toast.error('Weekly upload limit reached. Upgrade for unlimited uploads!');
      return;
    }
    
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
    setProcessingStep('creating_topic');

    try {
      console.log('[Upload] Step 1: Creating topic...');
      const newTopic = await createTopic.mutateAsync({ name: topicName.trim() });
      const topicId = newTopic.id;
      console.log('[Upload] Topic created:', topicId);

      setProcessingStep('generating');
      console.log('[Upload] Step 2: Calling AI to generate content...');
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
          toast.error('Too many requests. Please wait 30 seconds and try again.', { duration: 5000 });
        } else if (error.message?.includes('402')) {
          toast.error('AI credits exhausted. Contact support or wait for monthly reset.', { duration: 5000 });
        } else {
          toast.error(`Processing failed: ${error.message}`);
        }
        return;
      }

      console.log('[Upload] AI response received:', {
        extractedTextLength: data.extractedText?.length,
        summaryLength: data.summary?.length,
        flashcardsCount: data.flashcards?.length,
        questionsCount: data.questions?.length,
      });

      // Step 3: Save content upload FIRST (ensures data is captured)
      setProcessingStep('saving_upload');
      console.log('[Upload] Step 3: Saving content upload...');
      const { error: uploadError } = await supabase.from('content_uploads').insert({
        user_id: user.id,
        topic_id: topicId,
        file_name: file?.name || 'Text input',
        file_type: file?.type || 'text/plain',
        extracted_text: data.extractedText || contentText,
        summary: data.summary || null,
        flashcard_count: data.flashcards?.length || 0,
        question_count: data.questions?.length || 0,
        processed: true,
      });
      
      if (uploadError) {
        console.error('[Upload] Failed to save content upload:', uploadError);
        toast.error('Failed to save document record. Please try again.');
        return;
      }
      console.log('[Upload] Content upload saved successfully');

      // Step 4: Save flashcards
      setProcessingStep('saving_flashcards');
      if (data.flashcards?.length > 0) {
        console.log('[Upload] Step 4: Saving', data.flashcards.length, 'flashcards...');
        await bulkCreateFlashcards.mutateAsync(
          data.flashcards.map((f: { front: string; back: string }) => ({
            front: f.front,
            back: f.back,
            topic_id: topicId,
          }))
        );
        console.log('[Upload] Flashcards saved successfully');
      }

      // Step 5: Save questions
      setProcessingStep('saving_questions');
      if (data.questions?.length > 0) {
        console.log('[Upload] Step 5: Saving', data.questions.length, 'questions...');
        await bulkCreateQuestions.mutateAsync(
          data.questions.map((q: { question: string; options: string[]; correct_answer: string; explanation: string }) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            topic_id: topicId,
          }))
        );
        console.log('[Upload] Questions saved successfully');
      }

      // Step 6: Finalize
      setProcessingStep('finalizing');
      console.log('[Upload] Step 6: Finalizing...');
      await incrementUpload();
      await unlockFeature('first_upload_completed');
      
      const result = await awardXP({ eventType: 'practice_session', metadata: { type: 'upload' } });
      showXPGainToast({ amount: result.xpAwarded, eventType: 'practice_session' });
      await recordActivity();

      toast.success(`Generated summary, ${data.flashcards?.length || 0} flashcards and ${data.questions?.length || 0} questions!`);
      console.log('[Upload] Complete! Navigating to topics...');
      
      navigate('/topics');
    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Failed to process content. Please try again.');
    } finally {
      setProcessing(false);
      setProcessingStep('idle');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">
            Upload your study material
          </h1>
          <p className="text-muted-foreground mb-2">
            AI generates summaries, 20 flashcards + 30 practice questions
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Content stored for 60 days
          </div>
        </div>

        {/* Upload Methods */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setMethod('camera')}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                method === 'camera'
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              )}
            >
              <Camera className="w-6 h-6" />
              <span className="font-medium text-sm">Camera</span>
            </button>
            <button
              onClick={() => setMethod('file')}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                method === 'file'
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              )}
            >
              <FileText className="w-6 h-6" />
              <span className="font-medium text-sm">File</span>
            </button>
            <button
              onClick={() => setMethod('text')}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                method === 'text'
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              )}
            >
              <Type className="w-6 h-6" />
              <span className="font-medium text-sm">Text</span>
            </button>
          </div>

          {/* Content Input Area */}
          <div className="mb-6">
            {method === 'camera' && (
              <>
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
                      className="w-full rounded-lg max-h-48 object-contain bg-muted"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-accent/90 text-accent-foreground px-3 py-1 rounded-full text-sm">
                      <Check className="w-4 h-4" />
                      Ready for OCR
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={clearFile}
                      className="absolute top-2 right-2"
                    >
                      Retake
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed flex flex-col gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span>Tap to take a photo</span>
                  </Button>
                )}
              </>
            )}

            {method === 'file' && (
              <>
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
                          className="w-full rounded-lg max-h-48 object-contain bg-muted"
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
                    <Button variant="outline" size="sm" onClick={clearFile} className="w-full">
                      Choose different file
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="w-8 h-8 text-muted-foreground" />
                    <span>Tap to upload file</span>
                    <span className="text-xs text-muted-foreground">PDF, DOC, TXT, or Image</span>
                  </Button>
                )}
              </>
            )}

            {method === 'text' && (
              <Textarea
                placeholder="Paste your notes, textbook content, or any study material here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] text-base"
              />
            )}
          </div>

          {/* Topic Name */}
          <div className="mb-6">
            <Label className="text-sm mb-2 block">Topic Name</Label>
            <Input
              placeholder="e.g., Biology Chapter 5"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Submit Button */}
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full h-14 text-lg"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {STEP_MESSAGES[processingStep] || 'Processing...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Study Material
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
