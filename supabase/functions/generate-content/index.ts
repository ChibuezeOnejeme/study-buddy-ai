import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* -------------------- GEMINI CORE CALL -------------------- */
async function callGemini({
  apiKey,
  parts,
}: {
  apiKey: string;
  parts: any[];
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Gemini API error:', response.status, err);
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error('Empty Gemini response:', JSON.stringify(data));
    throw new Error("Empty Gemini response");
  }

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

/* -------------------- OCR -------------------- */
async function extractTextFromImage({
  imageBase64,
  mimeType,
  apiKey,
}: {
  imageBase64: string;
  mimeType: string;
  apiKey: string;
}) {
  console.log('Starting OCR extraction...');
  return await callGemini({
    apiKey,
    parts: [
      {
        text: `Extract ALL readable text from this image.

Return ONLY valid JSON:
{
  "extractedText": "full text"
}`,
      },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ],
  });
}

/* -------------------- SUMMARY -------------------- */
async function generateSummary({
  extractedText,
  apiKey,
}: {
  extractedText: string;
  apiKey: string;
}) {
  console.log('Generating summary...');
  return await callGemini({
    apiKey,
    parts: [
      {
        text: `Summarize the content below.

RULES:
- 300–500 words
- Focus on key concepts
- No markdown
- No extra text

Return ONLY valid JSON:
{
  "summary": "summary text"
}

CONTENT:
${extractedText}`,
      },
    ],
  });
}

/* -------------------- FLASHCARDS + QUESTIONS -------------------- */
async function generateStudyMaterial({
  extractedText,
  apiKey,
}: {
  extractedText: string;
  apiKey: string;
}) {
  console.log('Generating study materials...');
  return await callGemini({
    apiKey,
    parts: [
      {
        text: `Using ONLY the content below, generate study material.

STRICT RULES:
- EXACTLY 20 flashcards
- EXACTLY 30 multiple-choice questions
- 4 options per question
- No markdown
- No extra text

Return ONLY valid JSON:
{
  "flashcards": [
    { "front": "term or question", "back": "definition or answer" }
  ],
  "questions": [
    {
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "exact option text",
      "explanation": "why it is correct"
    }
  ]
}

CONTENT:
${extractedText}`,
      },
    ],
  });
}

/* -------------------- EDGE SERVE -------------------- */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('=== Generate Content Function Called ===');
    
    // Check API key
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      console.error('CRITICAL: Missing GOOGLE_AI_API_KEY environment variable');
      throw new Error("Missing GOOGLE_AI_API_KEY - Please configure in Supabase Edge Function settings");
    }

    // Parse request body
    const body = await req.json();
    console.log('Request received with keys:', Object.keys(body));
    
    // Accept both 'content' (old) and 'extractedText' (new) for backwards compatibility
    const { 
      content,           // From Upload.tsx (current implementation)
      extractedText: inputExtractedText,  // Alternative naming
      imageBase64, 
      mimeType,
      topicId            // Passed from frontend but not used here
    } = body;

    // Use whichever text field was provided
    let extractedText = inputExtractedText || content;

    console.log('Input analysis:', {
      hasContent: !!content,
      hasExtractedText: !!inputExtractedText,
      hasImage: !!imageBase64,
      hasMimeType: !!mimeType,
      topicId: topicId || 'not provided',
      textLength: extractedText?.length || 0
    });

    // STEP 1 — OCR (if image provided and no text)
    if (!extractedText && imageBase64 && mimeType) {
      console.log('No text provided, processing image with OCR...');
      console.log('Image details:', {
        mimeType,
        base64Length: imageBase64.length,
        base64Preview: imageBase64.substring(0, 50) + '...'
      });

      try {
        const ocr = await extractTextFromImage({
          imageBase64,
          mimeType,
          apiKey: GOOGLE_AI_API_KEY,
        });
        extractedText = ocr.extractedText;
        console.log('OCR completed successfully, extracted text length:', extractedText?.length || 0);
        
        if (extractedText) {
          console.log('OCR preview:', extractedText.substring(0, 200) + '...');
        }
      } catch (ocrError) {
        console.error('OCR failed:', ocrError);
        const errMsg = ocrError instanceof Error ? ocrError.message : String(ocrError);
        throw new Error(`Failed to extract text from image: ${errMsg}`);
      }
    }

    // Validate we have text to process
    if (!extractedText || extractedText.trim().length === 0) {
      console.error('VALIDATION FAILED: No text available for processing');
      throw new Error("No text content provided. Please upload an image, file, or paste text.");
    }

    if (extractedText.trim().length < 50) {
      console.warn('WARNING: Text content is very short:', extractedText.length, 'characters');
    }

    console.log('Processing text content:', {
      length: extractedText.length,
      preview: extractedText.substring(0, 150) + '...'
    });

    // STEP 2 — SUMMARY
    console.log('Step 2: Generating summary...');
    let summaryResult;
    try {
      summaryResult = await generateSummary({
        extractedText,
        apiKey: GOOGLE_AI_API_KEY,
      });
      console.log('Summary generated successfully, length:', summaryResult.summary?.length || 0);
    } catch (summaryError) {
      console.error('Summary generation failed:', summaryError);
      const errMsg = summaryError instanceof Error ? summaryError.message : String(summaryError);
      throw new Error(`Failed to generate summary: ${errMsg}`);
    }

    // STEP 3 — FLASHCARDS + QUESTIONS
    console.log('Step 3: Generating flashcards and questions...');
    let studyMaterial;
    try {
      studyMaterial = await generateStudyMaterial({
        extractedText,
        apiKey: GOOGLE_AI_API_KEY,
      });
      console.log('Study material generated:', {
        flashcardsCount: studyMaterial.flashcards?.length || 0,
        questionsCount: studyMaterial.questions?.length || 0,
      });

      // Validate generated content
      if (!studyMaterial.flashcards || studyMaterial.flashcards.length === 0) {
        console.warn('WARNING: No flashcards generated');
      }
      if (!studyMaterial.questions || studyMaterial.questions.length === 0) {
        console.warn('WARNING: No questions generated');
      }

      // Log first flashcard and question as samples
      if (studyMaterial.flashcards?.[0]) {
        console.log('Sample flashcard:', studyMaterial.flashcards[0]);
      }
      if (studyMaterial.questions?.[0]) {
        console.log('Sample question:', {
          question: studyMaterial.questions[0].question,
          optionsCount: studyMaterial.questions[0].options?.length
        });
      }

    } catch (studyError) {
      console.error('Study material generation failed:', studyError);
      const errMsg = studyError instanceof Error ? studyError.message : String(studyError);
      throw new Error(`Failed to generate study materials: ${errMsg}`);
    }

    const responseData = {
      extractedText,
      summary: summaryResult.summary,
      flashcards: studyMaterial.flashcards || [],
      questions: studyMaterial.questions || [],
    };

    console.log('=== Success! Sending response ===');
    console.log('Response summary:', {
      extractedTextLength: responseData.extractedText.length,
      summaryLength: responseData.summary?.length || 0,
      flashcardsCount: responseData.flashcards.length,
      questionsCount: responseData.questions.length,
    });

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('=== ERROR in generate-content function ===');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error message:', errorMessage);
    if (errorStack) console.error('Error stack:', errorStack);
    
    // Determine appropriate status code
    let statusCode = 500;

    if (errorMessage.includes('Missing GOOGLE_AI_API_KEY')) {
      statusCode = 503; // Service Unavailable
    } else if (errorMessage.includes('Gemini error 429')) {
      statusCode = 429; // Too Many Requests
    } else if (errorMessage.includes('Gemini error 402')) {
      statusCode = 402; // Payment Required
    } else if (errorMessage.includes('No text content')) {
      statusCode = 400; // Bad Request
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
