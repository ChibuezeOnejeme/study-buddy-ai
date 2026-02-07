import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* -------------------- GEMINI API CALL -------------------- */
async function callGemini(apiKey: string, prompt: string, imageData?: { mimeType: string; data: string }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  
  const parts: any[] = [{ text: prompt }];
  
  // Add image if provided
  if (imageData) {
    parts.push({
      inline_data: {
        mime_type: imageData.mimeType,
        data: imageData.data,
      },
    });
  }

  const requestBody = {
    contents: [{
      parts: parts,
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", res.status, errText);
    throw new Error(`Gemini API returned ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    console.error("Empty response from Gemini:", JSON.stringify(data));
    throw new Error("Empty response from Gemini");
  }

  return text;
}

/* -------------------- PARSE JSON FROM RESPONSE -------------------- */
function parseJsonResponse(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse JSON:", cleaned);
    throw new Error("Invalid JSON response from AI");
  }
}

/* -------------------- MAIN EDGE FUNCTION -------------------- */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ✅ Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
        }
      );
    }
    
    // ✅ Verify the JWT token with Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
        }
      );
    }

    console.log('Authenticated user:', user.id);

    // Get API key from environment
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("Missing GOOGLE_AI_API_KEY environment variable");
    }

    // Parse request body
    const body = await req.json();
    console.log("Received body:", JSON.stringify(body, null, 2));
    console.log("Content length:", body.content?.length || 0);
    console.log("Has image:", !!body.imageBase64);
    console.log("MIME type:", body.mimeType);

    let { content, imageBase64, mimeType } = body;

    console.log("Processing request:", { 
      hasContent: !!content, 
      hasImage: !!imageBase64,
      mimeType,
      userId: user.id
    });

    // STEP 1: Extract text from image if provided
    let extractedText = content || "";
    
    if (imageBase64 && mimeType) {
      console.log("Performing OCR on image...");
      
      const ocrPrompt = `Extract all readable text from this image. Be thorough and capture everything you see.
Return your response as JSON in this exact format:
{
  "extractedText": "the full text you extracted"
}`;

      const ocrResponse = await callGemini(
        GOOGLE_AI_API_KEY, 
        ocrPrompt,
        { mimeType, data: imageBase64 }
      );
      
      const ocrResult = parseJsonResponse(ocrResponse);
      extractedText = ocrResult.extractedText || "";
      console.log("OCR extracted text length:", extractedText.length);
    }

    // More lenient validation
    if (!extractedText?.trim() && !imageBase64) {
      throw new Error("No text content or image provided");
    }
    
    if (imageBase64 && !extractedText?.trim()) {
      throw new Error("Could not extract text from image. Please try a clearer photo.");
    }

    // STEP 2: Generate summary
    console.log("Generating summary...");
    const summaryPrompt = `Summarize the following content in 300-500 words. Focus on the key concepts and main points.

Content:
${extractedText}

Return your response as JSON in this exact format:
{
  "summary": "your summary here"
}`;

    const summaryResponse = await callGemini(GOOGLE_AI_API_KEY, summaryPrompt);
    const summaryResult = parseJsonResponse(summaryResponse);
    const summary = summaryResult.summary || "";

    // STEP 3: Generate flashcards and questions
    console.log("Generating flashcards and questions...");
    const studyPrompt = `Based on the following content, generate study materials:
- 20 flashcards (term/concept on front, definition/explanation on back)
- 30 multiple choice questions with 4 options each

Content:
${extractedText}

Return your response as JSON in this exact format:
{
  "flashcards": [
    {
      "front": "question or term",
      "back": "answer or definition"
    }
  ],
  "questions": [
    {
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer": "the correct option text",
      "explanation": "why this is correct"
    }
  ]
}

Make sure to generate exactly 20 flashcards and 30 questions.`;

    const studyResponse = await callGemini(GOOGLE_AI_API_KEY, studyPrompt);
    const studyResult = parseJsonResponse(studyResponse);

    // Validate results
    const flashcards = Array.isArray(studyResult.flashcards) ? studyResult.flashcards : [];
    const questions = Array.isArray(studyResult.questions) ? studyResult.questions : [];

    console.log(`Generated ${flashcards.length} flashcards and ${questions.length} questions`);

    // Return successful response
    return new Response(
      JSON.stringify({
        extractedText,
        summary,
        flashcards,
        questions,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Edge function error:", errorMessage, err);
    
    // Return appropriate status code
    const status = errorMessage.includes('Unauthorized') || 
                   errorMessage.includes('authorization') || 
                   errorMessage.includes('No authorization header') ? 401 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
      }
    );
  }
});
