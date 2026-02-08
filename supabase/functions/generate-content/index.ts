import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* -------------------- LOVABLE AI CALL -------------------- */
async function callLovableAI({
  prompt,
  imageBase64,
  mimeType,
}: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
}) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("Missing LOVABLE_API_KEY");
  }

  const messages: any[] = [];
  
  if (imageBase64 && mimeType) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
          },
        },
        {
          type: "text",
          text: prompt,
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: prompt,
    });
  }

  const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      temperature: 0.6,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Lovable AI error:", response.status, err);
    throw new Error(`Lovable AI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    console.error("Empty Lovable AI response:", JSON.stringify(data));
    throw new Error("Empty AI response");
  }

  return text;
}

/* -------------------- OCR -------------------- */
async function extractTextFromImage({
  imageBase64,
  mimeType,
}: {
  imageBase64: string;
  mimeType: string;
}) {
  console.log("Starting OCR extraction...");
  const text = await callLovableAI({
    prompt: `Extract ALL readable text from this image.
Return ONLY valid JSON:
{
  "extractedText": "full text here"
}`,
    imageBase64,
    mimeType,
  });

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

/* -------------------- SUMMARY -------------------- */
async function generateSummary({ extractedText }: { extractedText: string }) {
  console.log("Generating summary...");
  const text = await callLovableAI({
    prompt: `Summarize the content below.

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
  });

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

/* -------------------- FLASHCARDS + QUESTIONS -------------------- */
async function generateStudyMaterial({
  extractedText,
}: {
  extractedText: string;
}) {
  console.log("Generating study materials...");
  const text = await callLovableAI({
    prompt: `Using ONLY the content below, generate study material.

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
  });

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

/* -------------------- EDGE SERVE -------------------- */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Content Function Called ===");

    // Parse request body
    const body = await req.json();
    console.log("Request received with keys:", Object.keys(body));

    const {
      content,
      extractedText: inputExtractedText,
      imageBase64,
      mimeType,
      topicId,
    } = body;

    let extractedText = inputExtractedText || content;

    console.log("Input analysis:", {
      hasContent: !!content,
      hasExtractedText: !!inputExtractedText,
      hasImage: !!imageBase64,
      hasMimeType: !!mimeType,
      topicId: topicId || "not provided",
      textLength: extractedText?.length || 0,
    });

    // STEP 1 — OCR (if image provided and no text)
    if (!extractedText && imageBase64 && mimeType) {
      console.log("No text provided, processing image with OCR...");

      try {
        const ocr = await extractTextFromImage({
          imageBase64,
          mimeType,
        });
        extractedText = ocr.extractedText;
        console.log(
          "OCR completed successfully, extracted text length:",
          extractedText?.length || 0
        );
      } catch (ocrError) {
        console.error("OCR failed:", ocrError);
        const errMsg =
          ocrError instanceof Error ? ocrError.message : String(ocrError);
        throw new Error(`Failed to extract text from image: ${errMsg}`);
      }
    }

    // Validate we have text to process
    if (!extractedText || extractedText.trim().length === 0) {
      console.error("VALIDATION FAILED: No text available for processing");
      throw new Error(
        "No text content provided. Please upload an image, file, or paste text."
      );
    }

    console.log("Processing text content:", {
      length: extractedText.length,
      preview: extractedText.substring(0, 150) + "...",
    });

    // STEP 2 — SUMMARY
    console.log("Step 2: Generating summary...");
    let summaryResult;
    try {
      summaryResult = await generateSummary({ extractedText });
      console.log(
        "Summary generated successfully, length:",
        summaryResult.summary?.length || 0
      );
    } catch (summaryError) {
      console.error("Summary generation failed:", summaryError);
      const errMsg =
        summaryError instanceof Error
          ? summaryError.message
          : String(summaryError);
      throw new Error(`Failed to generate summary: ${errMsg}`);
    }

    // STEP 3 — FLASHCARDS + QUESTIONS
    console.log("Step 3: Generating flashcards and questions...");
    let studyMaterial;
    try {
      studyMaterial = await generateStudyMaterial({ extractedText });
      console.log("Study material generated:", {
        flashcardsCount: studyMaterial.flashcards?.length || 0,
        questionsCount: studyMaterial.questions?.length || 0,
      });
    } catch (studyError) {
      console.error("Study material generation failed:", studyError);
      const errMsg =
        studyError instanceof Error ? studyError.message : String(studyError);
      throw new Error(`Failed to generate study materials: ${errMsg}`);
    }

    const responseData = {
      extractedText,
      summary: summaryResult.summary,
      flashcards: studyMaterial.flashcards || [],
      questions: studyMaterial.questions || [],
    };

    console.log("=== Success! Sending response ===");

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("=== ERROR in generate-content function ===");
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error message:", errorMessage);

    let statusCode = 500;
    if (errorMessage.includes("No text content")) {
      statusCode = 400;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
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
