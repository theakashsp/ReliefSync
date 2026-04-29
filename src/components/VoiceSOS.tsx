import { useState, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceSOSProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type SpeechState = "idle" | "listening" | "processing";

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// Extend Window type for browser compatibility
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function VoiceSOS({ onTranscript, disabled = false }: VoiceSOSProps) {
  const [state, setState] = useState<SpeechState>("idle");
  const SpeechRec = getSpeechRecognition();

  const start = useCallback(() => {
    if (!SpeechRec) {
      toast.error("Voice input not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setState("listening");

    recognition.onresult = (event) => {
      setState("processing");
      const transcript = event.results[0]?.[0]?.transcript || "";
      onTranscript(transcript);
      toast.success(`Voice captured: "${transcript.slice(0, 60)}${transcript.length > 60 ? "…" : ""}"`);
      setState("idle");
    };

    recognition.onerror = (event) => {
      setState("idle");
      if (event.error === "no-speech") {
        toast.info("No speech detected. Try again.");
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow in browser settings.");
      } else {
        toast.error(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setState((s) => (s === "listening" ? "idle" : s));
    };

    recognition.start();
  }, [SpeechRec, onTranscript]);

  if (!SpeechRec) {
    return null; // Hide button on unsupported browsers
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled || state !== "idle"}
      title={state === "listening" ? "Listening…" : "Speak to describe the emergency"}
      className={`
        flex items-center justify-center h-9 w-9 rounded-lg border transition-all
        ${state === "listening"
          ? "gradient-emergency border-0 pulse-ring text-white"
          : "border-border hover:border-primary/40 text-muted-foreground hover:text-primary"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={state === "listening" ? "Listening for voice input" : "Start voice input"}
    >
      {state === "processing" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "listening" ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
