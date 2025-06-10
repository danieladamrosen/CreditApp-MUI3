import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface CreditReportHeaderProps {
  onShowTutorial?: () => void;
  showInstructionalVideo?: boolean;
}

export function CreditReportHeader({ onShowTutorial, showInstructionalVideo }: CreditReportHeaderProps) {

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-gray-900">Credit Report Analysis</h1>
            </div>
            <div className="hidden md:block h-4 w-px bg-gray-300"></div>
            <span className="hidden md:block text-sm text-gray-600 font-medium">Donald Blair</span>
          </div>
          <div className="flex items-center space-x-3">
            {onShowTutorial && !showInstructionalVideo && (
              <Button
                onClick={onShowTutorial}
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 px-3 py-1.5 text-sm font-medium"
              >
                <Video className="w-4 h-4" />
                Show Tutorial Video
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
