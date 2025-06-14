import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Calendar, Building, CheckCircle, FileText, AlertCircle, CheckCircle2, AlertTriangle, X, Save, ChevronDown, ChevronUp, ThumbsUp } from "lucide-react";

interface ModernInquiriesProps {
  creditData: any;
  onDisputeSaved?: (disputeData?: {
    reason: string;
    instruction: string;
    selectedItems: {[key: string]: boolean};
  }) => void;
  initialDisputeData?: {
    reason: string;
    instruction: string;
    selectedItems: {[key: string]: boolean};
  } | null;
  forceExpanded?: boolean;
}

export function ModernInquiries({ creditData, onDisputeSaved, initialDisputeData, forceExpanded }: ModernInquiriesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to save custom templates
  const saveTemplateMutation = useMutation({
    mutationFn: (data: { type: string; text: string; category: string }) =>
      fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template saved",
        description: "Your custom text has been saved for future use.",
      });
    },
  });
  const [selectedItems, setSelectedItems] = useState<{[key: string]: boolean}>(
    initialDisputeData?.selectedItems || {}
  );
  const [showCustomReasonField, setShowCustomReasonField] = useState(false);
  const [showCustomInstructionField, setShowCustomInstructionField] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(
    initialDisputeData?.reason || ""
  );
  const [selectedInstruction, setSelectedInstruction] = useState<string>(
    initialDisputeData?.instruction || ""
  );
  
  // Fix truncated instruction on component mount
  useEffect(() => {
    console.log('COMPONENT INIT DEBUG - initialDisputeData:', initialDisputeData);
    console.log('COMPONENT INIT DEBUG - instruction from prop:', initialDisputeData?.instruction);
    console.log('COMPONENT INIT DEBUG - instruction length:', initialDisputeData?.instruction?.length);
    
    // If instruction appears truncated (shorter than expected), restore the full text
    if (initialDisputeData?.instruction && initialDisputeData.instruction.length < 30) {
      console.log('FIXING TRUNCATED INSTRUCTION - restoring full text');
      const fullInstruction = "Please remove this unauthorized inquiry from my credit report";
      setSelectedInstruction(fullInstruction);
    }
  }, [initialDisputeData]);
  const [customReason, setCustomReason] = useState<string>("");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [isDisputeSaved, setIsDisputeSaved] = useState<boolean>(!!initialDisputeData);
  const [isTypingReason, setIsTypingReason] = useState(false);
  const [isTypingInstruction, setIsTypingInstruction] = useState(false);
  const [warningDialogs, setWarningDialogs] = useState<{[key: string]: boolean}>({});
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<{[key: string]: boolean}>({});
  const [bulkWarningDialog, setBulkWarningDialog] = useState<{isOpen: boolean, items: any[]}>({isOpen: false, items: []});
  const [showGuideArrow, setShowGuideArrow] = useState(false);
  const [showInquiryDetails, setShowInquiryDetails] = useState(!!initialDisputeData);
  // Helper function to check if a section has selected inquiries
  const shouldExpandSection = (sectionType: 'recent' | 'older') => {
    if (!initialDisputeData?.selectedItems) return false;
    
    const selectedItems = initialDisputeData.selectedItems as { [key: string]: boolean };
    const selectedKeys = Object.keys(selectedItems).filter(key => selectedItems[key]);
    
    if (sectionType === 'recent') {
      // Recent inquiries are the individual bureau inquiries (equifax-inquiry-X, experian-inquiry-X, transunion-inquiry-X)
      return selectedKeys.some(key => 
        key.includes('equifax-inquiry') || 
        key.includes('experian-inquiry') || 
        key.includes('transunion-inquiry') ||
        key.includes('recent-inquiry')
      );
    } else {
      // Older inquiries would have different naming pattern (older-inquiry-X)
      return selectedKeys.some(key => key.includes('older-inquiry'));
    }
  };

  const [showOlderInquiries, setShowOlderInquiries] = useState(shouldExpandSection('older'));
  const [showRecentInquiries, setShowRecentInquiries] = useState(shouldExpandSection('recent'));
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if form is complete and show guide arrow
  const checkFormCompletionAndShowArrow = (currentSelectedItems = selectedItems) => {
    // Check both custom fields and default selections
    const hasReason = customReason.trim() || selectedReason;
    const hasInstruction = customInstruction.trim() || selectedInstruction;
    const hasSelectedItems = Object.values(currentSelectedItems).some(Boolean);
    
    console.log("Arrow check - inquiries:", {
      hasSelectedItems,
      hasReason: !!hasReason,
      hasInstruction: !!hasInstruction,
      customReason,
      customInstruction,
      selectedReason,
      selectedInstruction,
      isDisputeSaved,
      currentSelectedItems
    });
    
    if (hasSelectedItems && hasReason && hasInstruction && !isDisputeSaved) {
      console.log("Showing inquiries arrow!");
      setShowGuideArrow(true);
      setTimeout(() => setShowGuideArrow(false), 4000);
    }
  };

  // Typing animation function
  const typeText = async (text: string, setter: (value: string) => void, isTypingSetter: (value: boolean) => void, speed: number = 30) => {
    isTypingSetter(true);
    setter("");
    
    for (let i = 0; i <= text.length; i++) {
      const currentText = text.slice(0, i);
      setter(currentText);
      console.log("typeText setting:", currentText);
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    
    isTypingSetter(false);
    console.log("typeText final result:", text);
  };

  // Function to auto-populate fields with typing effect
  const autoPopulateFields = async () => {
    setTimeout(async () => {
      // Type reason first
      await typeText(
        "I did not authorize this inquiry", 
        setSelectedReason, 
        setIsTypingReason, 
        25
      );
      
      // Small pause between reason and instruction
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then type instruction
      console.log("Starting instruction typing...");
      await typeText(
        "Please remove this unauthorized inquiry from my credit report", 
        setSelectedInstruction, 
        setIsTypingInstruction, 
        30
      );
      console.log("Instruction typing completed");
      
      // Check for arrow after both fields are complete
      setTimeout(() => {
        console.log("Final state after typing:", {
          selectedReason: "I did not authorize this inquiry",
          selectedInstruction: "Please remove this unauthorized inquiry from my credit report",
          hasSelectedItems: Object.values(selectedItems).some(Boolean),
          selectedItemsState: selectedItems
        });
        
        // Show the arrow now that typing is complete - always show since typing only happens when items are selected
        console.log("Showing inquiries arrow after typing!");
        setShowGuideArrow(true);
        setTimeout(() => setShowGuideArrow(false), 4000);
      }, 100);
    }, 150);
  };

  // Function to auto-populate fields with known selection state
  const autoPopulateFieldsWithSelection = async (currentSelectedItems: any) => {
    setTimeout(async () => {
      // Type reason first
      await typeText(
        "I did not authorize this inquiry", 
        setCustomReason, 
        setIsTypingReason, 
        25
      );
      
      // Small pause between reason and instruction
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then type instruction
      await typeText(
        "Please remove this unauthorized inquiry from my credit report", 
        setCustomInstruction, 
        setIsTypingInstruction, 
        30
      );
      
      // Check for arrow after both fields are complete - pass the known selection state
      setTimeout(() => {
        console.log("Final arrow check after auto-populate with selection:", currentSelectedItems);
        checkFormCompletionAndShowArrow();
      }, 1200);
    }, 150);
  };

  // Function to check if inquiry matches an open account
  const checkInquiryMatchesOpenAccount = (inquiry: any) => {
    const inquiryName = inquiry.name?.toLowerCase() || "";
    
    // Get all accounts from credit data
    const allAccounts = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
    
    // Check if any open account matches this inquiry
    const matchingAccount = allAccounts.find((account: any) => {
      const creditorName = account._CREDITOR?.["@_Name"]?.toLowerCase() || "";
      const subscriberCode = account["@_SubscriberCode"]?.toLowerCase() || "";
      const accountStatus = account["@_AccountStatusType"];
      
      // Only check open accounts
      const isOpen = accountStatus === "O" || accountStatus === "Open";
      
      if (!isOpen) return false;
      
      // Check if creditor name or subscriber code matches inquiry name
      return creditorName.includes(inquiryName) || 
             inquiryName.includes(creditorName) ||
             subscriberCode.includes(inquiryName) ||
             inquiryName.includes(subscriberCode);
    });
    
    return !!matchingAccount;
  };

  // Handle warning dialog responses
  const handleWarningResponse = (itemId: string, proceed: boolean) => {
    setWarningDialogs(prev => ({ ...prev, [itemId]: false }));
    
    if (proceed) {
      // User chose to proceed despite warning
      setAcknowledgedWarnings(prev => ({ ...prev, [itemId]: true }));
      
      // Now actually select the item
      const newSelectedItems = {
        ...selectedItems,
        [itemId]: true
      };
      setSelectedItems(newSelectedItems);

      console.log("Warning handled - new selected items:", newSelectedItems);

      // Check if we should auto-populate - always trigger typing when proceeding through warning
      const hasAnySelected = Object.values(newSelectedItems).some(Boolean);
      const wasFirstSelection = Object.values(selectedItems).every(value => !value);
      
      if (hasAnySelected && (wasFirstSelection || (!selectedReason && !selectedInstruction))) {
        console.log("Auto-populating after warning...");
        autoPopulateFields();
      } else {
        // Check form completion for arrow guidance when not auto-populating
        setTimeout(() => checkFormCompletionAndShowArrow(), 300);
      }
    }
    // If not proceeding, just close dialog and don't select
  };

  // Handle bulk warning dialog responses
  const handleBulkWarningResponse = (proceed: boolean) => {
    const warningItems = bulkWarningDialog.items;
    setBulkWarningDialog({isOpen: false, items: []});
    
    if (proceed) {
      // User confirmed, mark all as acknowledged
      const newAcknowledged = { ...acknowledgedWarnings };
      warningItems.forEach(item => {
        newAcknowledged[item.id] = true;
      });
      setAcknowledgedWarnings(newAcknowledged);
      
      // Get all recent items to select
      const currentDate = new Date();
      const cutoffDate = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
      
      const allItems = [
        ...createInquiryItems(transUnionInquiries, "TransUnion"),
        ...createInquiryItems(equifaxInquiries, "Equifax"), 
        ...createInquiryItems(experianInquiries, "Experian")
      ];
      
      const negativeItems = allItems.filter(item => {
        const inquiryDate = new Date(item.date);
        return inquiryDate >= cutoffDate;
      });
      
      // Proceed with selection
      const newSelections = { ...selectedItems };
      negativeItems.forEach(item => {
        newSelections[item.id] = true;
      });
      setSelectedItems(newSelections);
      
      // Auto-scroll to dispute section after proceeding through warning
      setTimeout(() => {
        console.log("Auto-scrolling after proceeding through warning");
        const disputeSection = document.querySelector('[data-section="inquiries"] .pt-3') || 
                             document.querySelector('[data-section="inquiries"]');
        if (disputeSection) {
          console.log("Found dispute section, scrolling");
          disputeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.log("Could not find dispute section for scroll");
        }
      }, 200);
      
      // Add red glow effect to the Hard Inquiries card after proceeding
      setTimeout(() => {
        const inquiriesCard = document.querySelector('[data-section="hard-inquiries"] .border');
        if (inquiriesCard) {
          inquiriesCard.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
          setTimeout(() => {
            inquiriesCard.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
          }, 800);
        }
      }, 100);
      
      // Auto-populate fields with typing effect after bulk selection
      const wasFirstBulkSelection = Object.values(selectedItems).every(value => !value);
      
      if (negativeItems.length > 0 && (wasFirstBulkSelection || !selectedReason || !selectedInstruction)) {
        autoPopulateFields();
      }
      
      // Scroll to the first selected inquiry after a brief delay
      if (negativeItems.length > 0) {
        setTimeout(() => {
          const firstItemId = negativeItems[0].id;
          console.log("Attempting to scroll to inquiry:", firstItemId);
          
          // Try multiple selectors to find the element
          let firstElement = document.querySelector(`[data-inquiry-id="${firstItemId}"]`);
          
          if (!firstElement) {
            console.log("Element not found with data-inquiry-id, trying alternative selectors...");
            // Alternative: look for any element containing the inquiry ID
            firstElement = document.querySelector(`[id*="${firstItemId}"]`);
          }
          
          if (firstElement) {
            console.log("Found element, scrolling to:", firstElement);
            // Get current scroll position and element position
            const currentScrollY = window.pageYOffset;
            const elementRect = firstElement.getBoundingClientRect();
            const elementTop = currentScrollY + elementRect.top;
            
            // Scroll to position element exactly at the top with no offset
            const targetScrollY = Math.max(0, elementTop + 5);
            
            // Removed scrolling to keep section in view
          } else {
            console.log("Could not find element to scroll to");
            // Fallback: scroll to the inquiries section
            const inquiriesSection = document.querySelector('[data-section="hard-inquiries"]');
            if (inquiriesSection) {
              console.log("Scrolling to inquiries section as fallback");
              const rect = inquiriesSection.getBoundingClientRect();
              const offsetTop = window.pageYOffset + rect.top - 80;
              // Removed scrolling to keep section in view
            }
          }
        }, 500);
      }

    }
  };

  // Get all inquiries from credit data
  const allInquiries = creditData?.CREDIT_RESPONSE?.CREDIT_INQUIRY || [];
  
  // Group inquiries by bureau
  const transUnionInquiries = allInquiries.filter((inquiry: any) => 
    inquiry.CREDIT_REPOSITORY?.["@_SourceType"] === "TransUnion"
  );
  const equifaxInquiries = allInquiries.filter((inquiry: any) => 
    inquiry.CREDIT_REPOSITORY?.["@_SourceType"] === "Equifax"
  );
  const experianInquiries = allInquiries.filter((inquiry: any) => 
    inquiry.CREDIT_REPOSITORY?.["@_SourceType"] === "Experian"
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const isRecentInquiry = (dateString: string) => {
    if (!dateString) return false;
    const inquiryDate = new Date(dateString);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return inquiryDate > twoYearsAgo;
  };

  const createInquiryItems = (inquiries: any[], bureauName: string) => {
    return inquiries.map((inquiry, index) => ({
      id: `${bureauName.toLowerCase()}-inquiry-${index}`,
      bureau: bureauName,
      name: inquiry["@_Name"] || "Unknown Company",
      date: inquiry["@_Date"] || "",
      type: inquiry["@CreditBusinessType"] || "Unknown",
      isRecent: isRecentInquiry(inquiry["@_Date"]),
      rawData: inquiry
    }));
  };

  const allInquiryItems = [
    ...createInquiryItems(transUnionInquiries, "TransUnion"),
    ...createInquiryItems(equifaxInquiries, "Equifax"),
    ...createInquiryItems(experianInquiries, "Experian")
  ];

  const disputeReasons = [
    "Select reason for disputing hard inquiry",
    "I did not authorize this inquiry",
    "This inquiry is from a company I never applied with",
    "This inquiry is older than 2 years",
    "I was only shopping for rates, not applying for credit",
    "Identity theft - inquiry made without my knowledge",
    "I never gave permission for this credit check",
    "This inquiry is a duplicate from the same company",
    "The inquiry date is incorrect",
    "Add new custom reason"
  ];

  const disputeInstructions = [
    "Select dispute instructions",
    "Please remove this unauthorized inquiry from my credit report",
    "Please investigate and remove this inquiry I never authorized",
    "Please delete this inquiry since it's over 2 years old",
    "Please remove this duplicate inquiry from rate shopping",
    "Please delete this inquiry due to identity theft",
    "Please remove this inquiry since I only requested information",
    "Please remove this duplicate inquiry from the same company",
    "Please correct the wrong date or remove this inquiry",
    "Add new custom instruction"
  ];

  const hasSelectedItems = Object.values(selectedItems).some(Boolean);

  // Count recent inquiries that impact credit score (within 24 months)
  const currentDate = new Date();
  const cutoffDate = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
  const recentInquiries = allInquiryItems.filter(item => {
    const inquiryDate = new Date(item.date);
    return inquiryDate >= cutoffDate;
  });
  
  // Separate older inquiries that don't impact score (24+ months old)
  const olderInquiries = allInquiryItems.filter(item => {
    const inquiryDate = new Date(item.date);
    return inquiryDate < cutoffDate;
  });



  // Remove internal collapse mechanism - parent page handles all collapse behavior

  // Show minimized view if no recent score-impacting inquiries and not expanded AND no saved dispute data
  if (recentInquiries.length === 0 && !showInquiryDetails && !initialDisputeData) {
    return (
      <div className="mb-8">


        <Card className="border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">No Recent Hard Inquiries</h3>
                  <p className="text-sm text-green-600 font-medium">
                    <span className="md:hidden">No score-impacting inquiries</span>
                    <span className="hidden md:inline">No score-impacting inquiries found</span>
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInquiryDetails(true)}
                className="text-xs"
              >
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleSelection = (itemId: string) => {
    console.log("toggleSelection called with:", itemId);
    console.log("Current selectedItems:", selectedItems);
    
    // If we're trying to select (not deselect), always check for warnings
    const isSelecting = !selectedItems[itemId];
    
    if (isSelecting) {
      // Find the inquiry item to check for warning
      const allItems = [
        ...createInquiryItems(transUnionInquiries, "TransUnion"),
        ...createInquiryItems(equifaxInquiries, "Equifax"),
        ...createInquiryItems(experianInquiries, "Experian")
      ];
      
      const currentItem = allItems.find(item => item.id === itemId);
      
      if (currentItem) {
        // Check if this is an older inquiry with no score impact
        if (!currentItem.isRecent) {
          setWarningDialogs(prev => ({ ...prev, [itemId]: true }));
          return; // Don't proceed with selection until warning is handled
        }
        
        // Check if inquiry matches an open account (for recent inquiries)
        if (checkInquiryMatchesOpenAccount(currentItem)) {
          setWarningDialogs(prev => ({ ...prev, [itemId]: true }));
          return; // Don't proceed with selection until warning is handled
        }
      }
    }
    
    const newSelectedItems = {
      ...selectedItems,
      [itemId]: !selectedItems[itemId]
    };
    
    console.log("New selectedItems will be:", newSelectedItems);
    setSelectedItems(newSelectedItems);

    // Check if we just selected an item and should auto-populate
    const hasAnySelected = Object.values(newSelectedItems).some(Boolean);
    const wasJustSelected = !selectedItems[itemId] && newSelectedItems[itemId];
    
    console.log("Selection state:", { hasAnySelected, wasJustSelected, customReason, customInstruction });
    
    // Reset dispute saved state if no items are selected
    if (!hasAnySelected && isDisputeSaved) {
      setIsDisputeSaved(false);
    }
    
    if (hasAnySelected && wasJustSelected && !selectedReason && !selectedInstruction) {
      console.log("Auto-populating fields...");
      // Auto-populate with typing effect when first item is selected
      autoPopulateFields();
    }
    // Don't check for arrow guidance here since auto-typing will handle it
  };

  const getBureauColor = (bureau: string) => {
    switch (bureau) {
      case "TransUnion": return "text-cyan-600";
      case "Equifax": return "text-red-600";
      case "Experian": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const renderInquiryItem = (item: any) => {
    const isSelected = selectedItems[item.id];
    
    return (
      <div
        key={item.id}
        data-inquiry-id={item.id}
        className="border border-gray-200 hover:border-gray-300 bg-gray-50 rounded-lg p-3 cursor-pointer transition-all duration-200"
        onClick={() => toggleSelection(item.id)}
      >
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelection(item.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Building className="w-3 h-3 text-gray-500" />
              <span className="text-sm font-bold text-gray-700 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(item.date)}</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">{item.type}</div>
            {item.isRecent ? (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600 font-medium">Impacts Score</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">No Impact to Score</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBureauColumn = (bureauName: string, inquiries: any[], showOlder: boolean = false) => {
    const bureauItems = createInquiryItems(inquiries, bureauName);
    const recentItems = bureauItems.filter(item => item.isRecent);
    const olderItems = bureauItems.filter(item => !item.isRecent);
    
    const getBureauColorClass = () => {
      switch (bureauName) {
        case "TransUnion": return "text-cyan-700";
        case "Equifax": return "text-red-700";
        case "Experian": return "text-blue-700";
        default: return "text-gray-700";
      }
    };

    // If showing older inquiries, only show older items
    // If not showing older inquiries, only show recent items
    const itemsToShow = showOlder ? olderItems : recentItems;

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className={`font-bold ${getBureauColorClass()}`}>{bureauName}</h3>
        </div>
        <div className="space-y-3">
          {itemsToShow.length === 0 ? (
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 flex items-center justify-center">
              <div className="text-center">
                <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h5 className="text-sm font-semibold text-gray-900 mb-1">Clean slate!</h5>
                <p className="text-xs text-gray-500">
                  {showOlder ? "No older inquiries found" : "No recent score-impacting inquiries"}
                </p>
              </div>
            </div>
          ) : (
            itemsToShow.map(renderInquiryItem)
          )}
        </div>
      </div>
    );
  };

  // Show collapsed state when dispute is saved
  if (isCollapsed && isDisputeSaved) {
    return (
      <div className="mb-8" data-section="hard-inquiries">
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-start md:items-center gap-3 flex-1">
            <div>
              <h2 className="text-2xl font-bold text-green-800 transition-colors duration-300 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Hard Inquiries
              </h2>
              <p className="text-xs text-gray-500 mt-1 md:hidden">*Inquiries older than 24 months don't impact score</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 hidden md:block">*Inquiries older than 24 months do not impact the score</p>
        </div>
        
        <Card className="border border-green-300 bg-green-50 transition-all duration-300 cursor-pointer hover:bg-green-100">
          <CardContent className="p-4">
            <div 
              className="flex items-center justify-between"
              onClick={() => setIsCollapsed(false)}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-700">
                    {(() => {
                      const count = Object.values(selectedItems).filter(Boolean).length;
                      if (count === 0) return 'Section Completed';
                      return `${count} Inquiry Dispute${count === 1 ? '' : 's'} Saved`;
                    })()}
                  </h3>
                  <p className="text-sm text-green-600 font-medium">
                    Click to expand and modify
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-800 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">

      <Card className={`border transition-all duration-500 ${
        isDisputeSaved 
          ? 'border-green-300 bg-green-50' 
          : hasSelectedItems 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-200 bg-white'
      }`}>
        <CardContent className="p-6 relative">
          {/* Collapse button in top right when saved */}
          {isDisputeSaved && (
            <button
              onClick={() => {
                console.log("Hard Inquiries up arrow clicked for collapse");
                setIsCollapsed(true);
                // Auto-scroll to 20px above the section heading
                setTimeout(() => {
                  const inquiriesSection = document.querySelector('[data-section="hard-inquiries"]');
                  if (inquiriesSection) {
                    const rect = inquiriesSection.getBoundingClientRect();
                    const targetScrollY = window.pageYOffset + rect.top - 20;
                    // Removed scrolling to keep section in view
                  }
                }, 100);
              }}
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors z-10"
              title="Collapse section"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          {/* Hide button for expanded inquiry section with no recent inquiries */}
          {recentInquiries.length === 0 && showInquiryDetails && (
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInquiryDetails(false)}
                className="text-xs"
              >
                Hide
              </Button>
            </div>
          )}
          
          <div className="mb-4">
            <p className="text-base text-gray-700">
              <span className={`inline-flex items-center justify-center w-6 h-6 md:w-5 md:h-5 text-white text-sm font-black rounded-full mr-2 transition-colors duration-300 flex-shrink-0 ${
                isDisputeSaved ? 'bg-green-600' : 'bg-blue-600'
              }`}>
                {isDisputeSaved ? '✓' : '1'}
              </span>
              <span className="font-bold">
                {isDisputeSaved ? 
                  (() => {
                    const count = Object.values(selectedItems).filter(Boolean).length;
                    if (count === 0) return 'Section completed';
                    return `${count} inquiry dispute${count === 1 ? '' : 's'} saved`;
                  })() : 
                  <span>
                    <span className="md:hidden">Choose inquiries (optional)</span>
                    <span className="hidden md:inline">Choose inquiries to dispute (optional)*</span>
                  </span>
                }
              </span>
              {isDisputeSaved && (
                <span className="block text-sm text-gray-600 font-normal mt-1">
                  Click to modify your selections
                </span>
              )}
            </p>
          </div>

          {/* Collapsed older inquiries section - TOP OF LIST */}
          {olderInquiries.length > 0 && !showOlderInquiries && (
            <div className="mb-6">
              <div 
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowOlderInquiries(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {olderInquiries.length} Older {olderInquiries.length === 1 ? 'Inquiry' : 'Inquiries'}
                    </h3>
                    <p className="text-sm text-green-600 font-medium">No Impact To Score</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          )}



          {/* Expanded older inquiries - TOP OF LIST */}
          {olderInquiries.length > 0 && showOlderInquiries && (
            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
              {/* Header with up arrow */}
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 transition-colors p-2 -m-2 rounded"
                onClick={() => {
                  setShowOlderInquiries(false);
                  
                  // When collapsing, scroll back to section start for both mobile and desktop
                  // Removed scrolling to keep section in view
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">
                    {olderInquiries.length} Older {olderInquiries.length === 1 ? 'Inquiry' : 'Inquiries'} - No Impact To Score
                  </h3>
                </div>
                <ChevronUp className="w-4 h-4 text-blue-600" />
              </div>
              
              {/* Content within the expanded container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TransUnion Column */}
                {renderBureauColumn("TransUnion", transUnionInquiries, true)}

                {/* Equifax Column */}
                {renderBureauColumn("Equifax", equifaxInquiries, true)}

                {/* Experian Column */}
                {renderBureauColumn("Experian", experianInquiries, true)}
              </div>
              
              {/* Hide Details link at bottom */}
              <div className="flex justify-center mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedItems({});
                    setShowOlderInquiries(false);
                    
                    // Removed scrolling to keep section in view
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Hide Details
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Collapsed recent inquiries section */}
          {recentInquiries.length > 0 && !showRecentInquiries && (
            <div className="mb-6">
              <div 
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowRecentInquiries(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {recentInquiries.length} Recent {recentInquiries.length === 1 ? 'Inquiry' : 'Inquiries'}
                    </h3>
                    <p className="text-sm text-orange-600 font-medium">May Impact Credit Score</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          )}

          {/* Expanded recent inquiries section */}
          {recentInquiries.length > 0 && showRecentInquiries && (
            <div className="mb-3 p-4 bg-white border border-gray-200 rounded-lg">
              {/* Header with up arrow */}
              <div className="mb-4">
                {/* Desktop layout - header and button side by side */}
                <div className="hidden md:flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowRecentInquiries(false);
                      
                      // Removed scrolling to keep section in view
                    }}
                    className="flex-1 text-left hover:bg-gray-50 transition-colors p-2 rounded mr-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900">
                        {recentInquiries.length} Recent {recentInquiries.length === 1 ? 'Inquiry' : 'Inquiries'} That May Impact Score
                      </h3>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent header click from collapsing
                      // Select all recent inquiries that impact credit score (within 24 months)
                      const currentDate = new Date();
                      const cutoffDate = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
                      
                      const allItems = [
                        ...createInquiryItems(transUnionInquiries, "TransUnion"),
                        ...createInquiryItems(equifaxInquiries, "Equifax"), 
                        ...createInquiryItems(experianInquiries, "Experian")
                      ];
                      
                      const negativeItems = allItems.filter(item => {
                        const inquiryDate = new Date(item.date);
                        return inquiryDate >= cutoffDate; // Only recent inquiries that impact score
                      });

                      // Check for items that match open accounts and need warnings
                      const itemsWithWarnings = negativeItems.filter(item => 
                        checkInquiryMatchesOpenAccount(item) && !acknowledgedWarnings[item.id]
                      );

                      if (itemsWithWarnings.length > 0) {
                        // Show styled bulk warning dialog
                        setBulkWarningDialog({isOpen: true, items: itemsWithWarnings});
                        return; // Don't select yet, wait for user response
                      }
                      
                      // Proceed with selection (no warnings needed)
                      const newSelections = { ...selectedItems };
                      negativeItems.forEach(item => {
                        newSelections[item.id] = true;
                      });
                      setSelectedItems(newSelections);
                      
                      // Auto-populate reason and instruction for quick testing
                      setSelectedReason("I did not authorize this inquiry");
                      setSelectedInstruction("Please remove this unauthorized inquiry from my credit report");
                      setShowCustomReasonField(false);
                      setShowCustomInstructionField(false);
                      console.log("Hard Inquiries: Auto-populated reason and instruction");
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 shrink-0"
                  >
                    Select All Score-Impact Items
                  </button>

                </div>

                {/* Mobile layout - header and button stacked */}
                <div className="md:hidden">
                  <button
                    onClick={() => {
                      setShowRecentInquiries(false);
                      
                      // On mobile, scroll back to section start when collapsing
                      if (window.innerWidth < 768) {
                        // Removed scrolling to keep section in view
                      }
                    }}
                    className="w-full text-left hover:bg-gray-50 transition-colors p-2 rounded mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <h3 className="font-semibold text-gray-900">
                        {recentInquiries.length} Recent {recentInquiries.length === 1 ? 'Inquiry' : 'Inquiries'} May Impact Score
                      </h3>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent header click from collapsing
                      // Select all recent inquiries that impact credit score (within 24 months)
                      const currentDate = new Date();
                      const cutoffDate = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
                      
                      const allItems = [
                        ...createInquiryItems(transUnionInquiries, "TransUnion"),
                        ...createInquiryItems(equifaxInquiries, "Equifax"), 
                        ...createInquiryItems(experianInquiries, "Experian")
                      ];
                      
                      const negativeItems = allItems.filter(item => {
                        const inquiryDate = new Date(item.date);
                        return inquiryDate >= cutoffDate; // Only recent inquiries that impact score
                      });

                      // Check for items that match open accounts and need warnings
                      const itemsWithWarnings = negativeItems.filter(item => 
                        checkInquiryMatchesOpenAccount(item) && !acknowledgedWarnings[item.id]
                      );

                      if (itemsWithWarnings.length > 0) {
                        // Show styled bulk warning dialog
                        setBulkWarningDialog({isOpen: true, items: itemsWithWarnings});
                        return; // Don't select yet, wait for user response
                      }
                      
                      // Proceed with selection (no warnings needed)
                      const newSelections = { ...selectedItems };
                      negativeItems.forEach(item => {
                        newSelections[item.id] = true;
                      });
                      setSelectedItems(newSelections);
                      
                      // Auto-scroll to dispute section after selection
                      setTimeout(() => {
                        console.log("Auto-scrolling after direct selection (no warnings)");
                        const disputeSection = document.querySelector('[data-section="inquiries"] .pt-3') || 
                                             document.querySelector('[data-section="inquiries"]');
                        if (disputeSection) {
                          console.log("Found dispute section, scrolling");
                          disputeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                          console.log("Could not find dispute section for scroll");
                        }
                      }, 200);
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                  >
                    Select All Score-Impact Items
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TransUnion Column */}
              {renderBureauColumn("TransUnion", transUnionInquiries, false)}

              {/* Equifax Column */}
              {renderBureauColumn("Equifax", equifaxInquiries, false)}

              {/* Experian Column */}
              {renderBureauColumn("Experian", experianInquiries, false)}
              </div>
              
              {/* Hide Details link at bottom */}
              <div className="flex justify-center mt-1 pt-1 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedItems({});
                    setShowRecentInquiries(false);
                    
                    // Removed scrolling to keep section in view
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  Hide Details
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Dispute Section */}
          {hasSelectedItems && (
            <div className={`pt-3 md:pt-6 mt-3 md:mt-6 ${hasSelectedItems ? 'md:border-t' : 'border-t'}`}>
              <div className="space-y-4">
                <p className="text-base text-gray-700 mb-4">
                  <span className={`inline-flex items-center justify-center w-6 h-6 md:w-5 md:h-5 text-white text-sm font-black rounded-full mr-2 flex-shrink-0 transition-colors duration-300 ${
                    isDisputeSaved ? 'bg-green-600' : 'bg-blue-600'
                  }`}>2</span>
                  <span className="font-bold">
                    {isDisputeSaved ? 'Dispute details completed' : 'Create hard inquiry dispute'}
                  </span>
                </p>
                {/* Reason Selection */}
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Dispute Reason</label>
                    </div>
                    <div className="relative">
                      {isTypingReason ? (
                        <div className="relative">
                          <div className="absolute -top-7 right-0 flex items-center gap-1 text-blue-600 text-xs z-10">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                            <span>AI typing</span>
                          </div>
                          <div className="w-full p-3 border border-blue-300 rounded-md bg-blue-50 text-gray-900" style={{ 
                            minHeight: '42px',
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word', 
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }}>
                            {selectedReason || "AI is typing..."}
                          </div>
                        </div>
                      ) : !showCustomReasonField ? (
                        <Select
                          value={selectedReason}
                          onValueChange={(value) => {
                            // Reset dispute saved state when dropdown is changed
                            if (isDisputeSaved) {
                              setIsDisputeSaved(false);
                            }
                            if (value === "custom") {
                              setShowCustomReasonField(true);
                              setSelectedReason("");
                            } else {
                              setSelectedReason(value);
                            }
                            setTimeout(() => checkFormCompletionAndShowArrow(), 300);
                          }}
                        >
                          <SelectTrigger className="w-full border-gray-300">
                            <SelectValue placeholder="Select reason for disputing inquiry" />
                          </SelectTrigger>
                          <SelectContent>
                            {disputeReasons.slice(1, -1).map((reason) => (
                              <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                            ))}
                            <SelectItem value="custom">✏️ Write custom reason...</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span></span>
                            <button
                              onClick={() => {
                                setCustomReason("");
                                setShowCustomReasonField(false);
                                setSelectedReason("");
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Clear & Start Over
                            </button>
                          </div>
                          <textarea
                            value={customReason || ""}
                            placeholder="Enter your dispute reason..."
                            className="w-full p-3 border border-gray-300 rounded-md h-20 resize-none mobile-resizable focus:outline-none focus:border-gray-400"
                            onChange={(e) => {
                              setCustomReason(e.target.value);
                              // Reset dispute saved state when text is modified
                              if (isDisputeSaved) {
                                setIsDisputeSaved(false);
                              }
                            }}
                            rows={3}
                          />
                          {false && customReason.trim() && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  saveTemplateMutation.mutate({
                                    type: 'reason',
                                    text: customReason.trim(),
                                    category: 'inquiries'
                                  });
                                }}
                                disabled={saveTemplateMutation.isPending}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                {saveTemplateMutation.isPending ? 'Saving...' : 'Save for future use'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* Instructions Selection */}
                <div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Dispute Instruction</label>
                    </div>
                    <div className="relative">
                      {isTypingInstruction ? (
                        <div className="relative">
                          <div className="absolute -top-7 right-0 flex items-center gap-1 text-blue-600 text-xs z-10">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                            <span>AI typing</span>
                          </div>
                          <div className="w-full p-3 border border-blue-300 rounded-md bg-blue-50 text-gray-900" style={{ 
                            minHeight: '42px',
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word', 
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }}>
                            {selectedInstruction || "AI is typing..."}
                          </div>
                        </div>
                      ) : !showCustomInstructionField ? (
                        <Select
                          value={selectedInstruction}
                          onValueChange={(value) => {
                            // Reset dispute saved state when dropdown is changed
                            if (isDisputeSaved) {
                              setIsDisputeSaved(false);
                            }
                            if (value === "custom") {
                              setShowCustomInstructionField(true);
                              setSelectedInstruction("");
                            } else {
                              setSelectedInstruction(value);
                            }
                            setTimeout(() => checkFormCompletionAndShowArrow(), 300);
                          }}
                        >
                          <SelectTrigger className="w-full border-gray-300">
                            <SelectValue placeholder="Select dispute instructions" />
                          </SelectTrigger>
                          <SelectContent>
                            {disputeInstructions.slice(1, -1).map((instruction) => (
                              <SelectItem key={instruction} value={instruction}>{instruction}</SelectItem>
                            ))}
                            <SelectItem value="custom">✏️ Write custom instructions...</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span></span>
                            <button
                              onClick={() => {
                                setCustomInstruction("");
                                setShowCustomInstructionField(false);
                                setSelectedInstruction("");
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Clear & Start Over
                            </button>
                          </div>
                          <textarea
                            value={customInstruction || ""}
                            placeholder="Enter your dispute instructions..."
                            className="w-full p-3 border border-gray-300 rounded-md h-20 resize-none mobile-resizable focus:outline-none focus:border-gray-400"
                            onChange={(e) => {
                              setCustomInstruction(e.target.value);
                              // Reset dispute saved state when text is modified
                              if (isDisputeSaved) {
                                setIsDisputeSaved(false);
                              }
                            }}
                            rows={3}
                          />
                          {false && customInstruction.trim() && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  saveTemplateMutation.mutate({
                                    type: 'instruction',
                                    text: customInstruction.trim(),
                                    category: 'inquiries'
                                  });
                                }}
                                disabled={saveTemplateMutation.isPending}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                {saveTemplateMutation.isPending ? 'Saving...' : 'Save for future use'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* Save Button Section */}
                <div className="flex gap-2 justify-between items-center">
                  {(!selectedReason && !customReason) || (!selectedInstruction && !customInstruction) ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-md px-3 py-1">
                      <AlertTriangle className="hidden md:block w-4 h-4 text-red-500" />
                      <span className="text-xs md:text-sm font-medium text-red-700">
                        <span className="md:hidden">Complete Step 2</span>
                        <span className="hidden md:inline">Complete Reason & Instruction</span>
                      </span>
                    </div>
                  ) : <div></div>}
                  <div className="flex items-center gap-2 relative overflow-visible">
                    {/* Flying Arrow Guide */}
                    {showGuideArrow && (
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 z-50 pr-2 pointer-events-none" style={{width: 'calc(100vw - 160px)', left: 'calc(-100vw + 140px)'}}>
                        <div className="flex items-center animate-fly-arrow">
                          <div className="w-16 h-1 bg-blue-600"></div>
                          <div className="w-0 h-0 border-l-[10px] border-t-[6px] border-b-[6px] border-l-blue-600 border-t-transparent border-b-transparent"></div>
                        </div>
                      </div>
                    )}
                    <span className="inline-flex items-center justify-center w-6 h-6 md:w-5 md:h-5 bg-blue-600 text-white text-sm font-bold rounded-full mr-1">3</span>
                    <Button
                      onClick={() => {
                      // If already saved and no changes were made, still trigger choreography
                      if (isDisputeSaved && initialDisputeData) {
                        console.log('SAVE CLICKED - Already saved dispute, triggering choreography');
                        // Maintain saved state but still call parent for choreography
                        if (onDisputeSaved) {
                          const disputeData = {
                            reason: selectedReason || "I did not authorize this inquiry",
                            instruction: selectedInstruction || "Please remove this unauthorized inquiry from my credit report",
                            selectedItems
                          };
                          onDisputeSaved(disputeData);
                        }
                        return;
                      }
                      
                      console.log('SAVE CLICKED - Checking typing state:', { isTypingReason, isTypingInstruction });
                      
                      // If typing is in progress, complete it immediately before saving
                      if (isTypingReason || isTypingInstruction) {
                        console.log('SAVE CLICKED - Typing in progress, completing immediately');
                        
                        // Complete any ongoing typing animations immediately
                        if (isTypingReason) {
                          setIsTypingReason(false);
                          // Force the complete reason text regardless of current state
                          setSelectedReason("I did not authorize this inquiry");
                        }
                        
                        if (isTypingInstruction) {
                          setIsTypingInstruction(false);
                          // Force the complete instruction text regardless of current state
                          setSelectedInstruction("Please remove this unauthorized inquiry from my credit report");
                        }
                        
                        // Wait a brief moment for state to update, then save
                        setTimeout(() => {
                          performSave();
                        }, 100);
                      } else {
                        // No typing in progress, save immediately
                        performSave();
                      }
                      
                      function performSave() {
                        const selectedItemsList = Object.keys(selectedItems).filter(key => selectedItems[key]);
                        console.log(`Saved ${selectedItemsList.length} hard inquiry disputes`);
                        
                        // Show green state and call parent handler immediately
                        setIsDisputeSaved(true);
                        
                        // Call parent handler for choreography - let main page handle timing
                        if (onDisputeSaved) {
                          // Force complete text values when auto-typing was used
                          let finalReason = selectedReason.trim() || customReason.trim();
                          let finalInstruction = selectedInstruction.trim() || customInstruction.trim();
                          
                          // If we have auto-selected items and default text patterns, ensure complete text
                          const hasAutoSelectedItems = Object.keys(selectedItems).some(key => 
                            selectedItems[key] && key.includes('inquiry')
                          );
                          
                          if (hasAutoSelectedItems) {
                            // For inquiry disputes, always use complete expected text
                            if (!finalReason || finalReason === "I did not authorize this inquiry") {
                              finalReason = "I did not authorize this inquiry";
                            }
                            if (!finalInstruction || finalInstruction.includes("Please remove this unauthorized")) {
                              finalInstruction = "Please remove this unauthorized inquiry from my credit report";
                            }
                          }
                          
                          console.log('SAVE DEBUG - Final reason text:', finalReason);
                          console.log('SAVE DEBUG - Final instruction text:', finalInstruction);
                          console.log('SAVE DEBUG - Instruction length:', finalInstruction.length);
                          
                          const disputeData = {
                            reason: finalReason,
                            instruction: finalInstruction,
                            selectedItems
                          };
                          console.log('SAVE DEBUG - Complete disputeData:', disputeData);
                          onDisputeSaved(disputeData);
                        }
                      }
                    }}
                    disabled={(() => {
                      const hasReason = selectedReason.trim() || customReason.trim();
                      const hasInstruction = selectedInstruction.trim() || customInstruction.trim();
                      const isDisabled = !hasSelectedItems || !hasReason || !hasInstruction;
                      
                      return isDisabled;
                    })()}
                    className={`${
                      isDisputeSaved 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white px-4 py-2 rounded-md disabled:bg-gray-400 transition-colors duration-200`}
                  >
                    {isDisputeSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="hidden md:inline">Dispute Saved</span>
                        <span className="md:hidden">Saved</span>
                      </>
                    ) : (
                      'Save Dispute and Continue'
                    )}
                  </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Dialogs */}
      {Object.entries(warningDialogs).map(([itemId, isOpen]) => {
        if (!isOpen) return null;
        
        const allItems = [
          ...createInquiryItems(transUnionInquiries, "TransUnion"),
          ...createInquiryItems(equifaxInquiries, "Equifax"), 
          ...createInquiryItems(experianInquiries, "Experian")
        ];
        
        const item = allItems.find(i => i.id === itemId);
        if (!item) return null;

        return (
          <div key={itemId} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className={`w-8 h-8 ${checkInquiryMatchesOpenAccount(item) ? 'text-red-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex-1">
                  {!item.isRecent ? (
                    // Warning for older inquiries with no score impact
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {checkInquiryMatchesOpenAccount(item) ? 'WARNING' : 'No Score Impact'}
                      </h3>
                      <p className="text-gray-700 mb-4">
                        This inquiry from <strong>{item.name}</strong> is over 2 years old and doesn't affect your credit score. There's no reason to dispute it.
                      </p>
                      {checkInquiryMatchesOpenAccount(item) && (
                        <p className="text-gray-700 mb-6">
                          Also, this inquiry matches an open account on your report. Disputing this could close your account and hurt your credit score.
                        </p>
                      )}
                    </>
                  ) : checkInquiryMatchesOpenAccount(item) ? (
                    // Warning for inquiries that match open accounts
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Open Account Found
                      </h3>
                      <p className="text-gray-700 mb-4">
                        This inquiry from <strong>{item.name}</strong> matches an open account on your report.
                      </p>
                      <p className="text-gray-700 mb-6">
                        Disputing this could close your account and hurt your credit score.
                      </p>
                    </>
                  ) : (
                    // Default warning (shouldn't happen with current logic)
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Warning
                      </h3>
                      <p className="text-gray-700 mb-6">
                        Please review this inquiry carefully before disputing.
                      </p>
                    </>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleWarningResponse(itemId, false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleWarningResponse(itemId, true)}
                      className={`flex-1 ${checkInquiryMatchesOpenAccount(item) ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                      Continue Anyway
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => handleWarningResponse(itemId, false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Bulk Warning Dialog */}
      {bulkWarningDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg mx-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Warning: Multiple Account Matches
                </h3>
                <p className="text-gray-700 mb-4">
                  {bulkWarningDialog.items.length === 1 
                    ? `The inquiry from "${bulkWarningDialog.items[0].name}" appears to match an open account on your credit report.`
                    : `${bulkWarningDialog.items.length} inquiries appear to match open accounts:`
                  }
                </p>
                {bulkWarningDialog.items.length > 1 && (
                  <ul className="list-disc pl-5 text-gray-700 mb-4">
                    {bulkWarningDialog.items.map((item, index) => (
                      <li key={index}><strong>{item.name}</strong></li>
                    ))}
                  </ul>
                )}
                <p className="text-gray-700 mb-4">
                  Disputing {bulkWarningDialog.items.length === 1 ? 'this inquiry' : 'these inquiries'} may:
                </p>
                <ul className="list-disc pl-5 text-gray-700 mb-4 space-y-1">
                  <li>Potentially close your open {bulkWarningDialog.items.length === 1 ? 'account' : 'accounts'}</li>
                  <li>Reduce your available credit</li>
                  <li>Negatively impact your credit score</li>
                  <li>Affect your credit utilization ratio</li>
                </ul>
                <p className="text-gray-700 mb-6">
                  Only dispute {bulkWarningDialog.items.length === 1 ? 'this inquiry' : 'these inquiries'} if you're certain {bulkWarningDialog.items.length === 1 ? 'it was' : 'they were'} unauthorized or if you're willing to accept these risks.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleBulkWarningResponse(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleBulkWarningResponse(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Proceed Anyway
                  </Button>
                </div>
              </div>
              <button
                onClick={() => handleBulkWarningResponse(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}