import type {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
} from "openai";

type Error = {
  error: {
    type: string;
    code: string | "context_length_exceeded";
    message?: string;
  };
};

const convertBlobToBase64 = (blob: Blob) =>
  new Promise<string | ArrayBuffer | null>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });

export async function elevenlabs({
  input,
}: {
  input: string;
}): Promise<string | ArrayBuffer | null> {
  let voice_id = "21m00Tcm4TlvDq8ikWAM"; //Change the value to the available voice ID you prefer.

  const ELEVENLABS_API_KEY = "ee39fc2f6bb06e0187835742b0b65227";

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
  const headers = {
    Accept: "audio/mpeg",
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
  };
  const reqBody = JSON.stringify({
    text: input,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: reqBody,
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const result = await response.blob();
    console.log("background result", { result });
    const base64 = await convertBlobToBase64(result);
    console.log("background result", { base64 });
    return base64;
    
  } catch (error) {
    console.log(error);
    return error as string;
  }
}

async function handleError(
  response: Response,
  whenContextExceeded?: () => Promise<unknown>
) {
  if (response.status !== 200) {
    const responseError: Error = await response.json();

    if (responseError.error.code === "context_length_exceeded") {
      await whenContextExceeded?.();
      return;
    }

    const error = new Error();
    error.name = responseError.error.type;
    error.message =
      responseError.error.code + responseError.error.message ?? "";
    throw error;
  }
}

async function parseResult(
  response: Response,
  onDelta?: (chunk: string) => unknown
) {
  const reader = response.body
    ?.pipeThrough(new TextDecoderStream())
    .getReader();

  let result = "";
  while (reader) {
    const { value: _value, done } = await reader.read();
    const value = (_value as string).trim();
    if (done) {
      break;
    }
    const lines = value.split("\n\n").filter(Boolean);
    const chunks = lines
      .map((line) => line.substring(5).trim())
      .map(parseToJSON)
      .map((data) => data?.choices.at(0).delta.content)
      .filter(Boolean);

    chunks.forEach((chunk) => {
      result += chunk;
      onDelta?.(chunk);
    });

    if (value.includes("data: [DONE]")) {
      break;
    }
  }
  return result;
}

const parseToJSON = (line: string) => {
  try {
    return JSON.parse(line);
  } catch (e) {
    console.error(e);
    return;
  }
};

async function requestApi(apiKey: string, body: CreateChatCompletionRequest) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
    body: JSON.stringify(body),
  });
}

function hasChats(chats?: Chat[]): chats is Chat[] {
  return chats !== undefined && chats.length > 0;
}

function convertChatsToMessages(chats: Chat[]): ChatCompletionRequestMessage[] {
  return chats
    .filter((chat) => chat.role !== "error")
    .map((chat) => {
      return {
        role: chat.role === "user" ? "user" : "assistant",
        content: chat.content,
      };
    });
}
