import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackSectionProps {
  canSendFeedback: boolean;
  onFeedback: (positive: boolean) => void;
}

export default function FeedbackSection({ canSendFeedback, onFeedback }: FeedbackSectionProps) {
  if (!canSendFeedback) {
    return null;
  }

  return (
    <div className="mt-6 bg-card rounded-xl border border-border shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">How was this conversation?</span>
          <div className="flex space-x-2">
            <button
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-accent transition-colors"
              onClick={() => onFeedback(true)}
              data-testid="feedback-positive"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Good</span>
            </button>
            <button
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => onFeedback(false)}
              data-testid="feedback-negative"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Poor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
