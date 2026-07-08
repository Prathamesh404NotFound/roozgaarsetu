import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onAudioCaptured: (base64Audio: string) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: {
    new(): SpeechRecognition;
  };
  webkitSpeechRecognition?: {
    new(): SpeechRecognition;
  };
}

export const VoiceRecorder = ({ onTranscript, onAudioCaptured }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recognizing, setRecognizing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as WindowWithSpeechRecognition).SpeechRecognition || (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-IN"; // Prefer Indian English/Hindi transliteration

      rec.onstart = () => {
        setRecognizing(true);
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      rec.onerror = (e: { error: string }) => {
        console.error("Speech recognition error:", e);
      };

      rec.onend = () => {
        setRecognizing(false);
      };

      recognitionRef.current = rec;
    } else {
      console.warn("Web Speech API is not supported in this browser.");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onTranscript]);

  // Duration Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });

        // Convert Blob to Base64 data URL
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAudioCaptured(base64data);
        };

        // Stop all media tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start speech recognition if supported
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Failed to start Speech Recognition:", e);
        }
      } else {
        toast.info("Microphone capturing active. Speech-to-text not supported on this browser; audio file will be attached directly.");
      }
    } catch (err) {
      console.error("Camera/Mic access denied:", err);
      toast.error("Microphone hardware permissions denied. Please allow microphone permissions in settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current && recognizing) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white animate-pulse hover:bg-red-700 transition"
          title="Stop Recording"
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/95 transition shadow-sm"
          title="Start Recording Voice Instruction"
        >
          <Mic className="h-4 w-4" />
        </button>
      )}

      <div className="flex-1 min-w-[120px]">
        {isRecording ? (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-semibold text-foreground">
              Recording ({formatTime(duration)})
            </span>
            {recognizing && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse ml-1.5">
                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Speech Translating...
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Click microphone to record details instead of typing.
          </p>
        )}
      </div>

      {isRecording && (
        <button
          type="button"
          onClick={() => {
            stopRecording();
            onAudioCaptured("");
            toast.info("Recording discarded.");
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition"
          title="Discard Recording"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
