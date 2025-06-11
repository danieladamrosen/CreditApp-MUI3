import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  FileText, 
  Plus, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Save, 
  X, 
  Lightbulb 
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PaymentHistoryVisual } from "./payment-history-visual";

interface ModernAccountRowProps {
  account: any;
  aiViolations?: string[];
  onDispute?: (account: any) => void;
  disputeReasons?: string[];
  disputeInstructions?: string[];
  isFirstCopy?: boolean;
  showDropdowns?: boolean;
  onDisputeSaved?: (accountId: string) => void;
  expandAll?: boolean;
  aiScanCompleted?: boolean;
}

export function ModernAccountRow({ 
  account, 
  aiViolations = [], 
  onDispute, 
  disputeReasons: passedReasons = [], 
  disputeInstructions: passedInstructions = [], 
  isFirstCopy = false, 
  showDropdowns = false, 
  onDisputeSaved, 
  expandAll = false, 
  aiScanCompleted = false 
}: ModernAccountRowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create a unique identifier for this account instance
  const accountUniqueId = `${account['@_SubscriberCode']}-${account['@_AccountIdentifier'] || account['@_AccountNumber'] || account['@_CurrentBalance'] || 'unknown'}`;

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
  // Dispute form state
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [selectedInstruction, setSelectedInstruction] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);
  const [isDisputeSaved, setIsDisputeSaved] = useState(false);

  // UI visibility state
  const [showViolations, setShowViolations] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showCustomReasonField, setShowCustomReasonField] = useState(false);
  const [showCustomInstructionField, setShowCustomInstructionField] = useState(false);
  const [showGuideArrow, setShowGuideArrow] = useState(false);
  const [showPositiveDetails, setShowPositiveDetails] = useState(false);
  const [showGuidedHelp, setShowGuidedHelp] = useState(false);

  // AI typing animation state
  const [isTypingReason, setIsTypingReason] = useState(false);
  const [isTypingInstruction, setIsTypingInstruction] = useState(false);
  const [typedReason, setTypedReason] = useState("");
  const [typedInstruction, setTypedInstruction] = useState("");
  const [hasAiGeneratedText, setHasAiGeneratedText] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);

  // Utility functions
  const getAccountType = () => account["@_AccountType"] || "Credit Card";
  const isPublicRecord = () => account["@_AccountType"] === "Public Record" || account.publicRecordType;

  // Dispute template configurations
  const getDisputeTemplates = (creditorName: string) => ({
    chargedOff: [
      {
        title: "Paid/Settled Debt Violation",
        reason: "This account was paid in full or settled",
        instruction: `My credit report shows an outstanding balance owed to ${creditorName}. This account was paid in full/settled, and no further amount is due. Please update to reflect zero balance.`
      },
      {
        title: "Inaccurate Balance Reporting",
        reason: "The balance amount reported is incorrect",
        instruction: `The balance shown for ${creditorName} is inaccurate. Please verify the correct balance with the original creditor and update accordingly.`
      },
      {
        title: "Outdated Account (7-Year Rule)",
        reason: "This account exceeds the 7-year reporting period",
        instruction: `This negative account is older than 7 years from the date of first delinquency. Per FCRA Section 605, please remove this outdated account immediately.`
      }
    ],
    collection: [
      {
        title: "Debt Validation Request",
        reason: "Requesting validation of this debt",
        instruction: `Please provide validation that this debt belongs to me, including the original signed agreement and complete payment history. Per FDCPA Section 809, collection must cease until validation is provided.`
      },
      {
        title: "Unauthorized Collection",
        reason: "Collection agency not authorized to collect",
        instruction: `Please provide proof that ${creditorName} is authorized to collect this debt, including the assignment agreement from the original creditor.`
      },
      {
        title: "Duplicate Collection Reporting",
        reason: "Both original creditor and collection agency reporting",
        instruction: `My credit report shows both the original creditor and collection agency reporting the same debt. This duplicate reporting inflates my debt ratio. Please remove the duplicate entry.`
      }
    ],
    latePayment: [
      {
        title: "Incorrect Late Payment Marks",
        reason: "These payments were made on time",
        instruction: `My credit report shows late payments to ${creditorName}. Those payments were made on time. Please update the payment history to reflect accurate payment dates and remove late markings.`
      },
      {
        title: "Payment History Verification",
        reason: "Request verification of payment dates",
        instruction: `Please verify the payment history with ${creditorName} and provide documentation showing the actual payment dates. The current reporting appears inaccurate.`
      },
      {
        title: "Date of Last Activity Error",
        reason: "The date of last activity is incorrect",
        instruction: `The date of last activity reported for ${creditorName} is inaccurate. Please verify and correct this date as it affects the reporting period calculation.`
      }
    ],
    general: [
      {
        title: "Account Does Not Belong to Me",
        reason: "This account does not belong to me",
        instruction: `My credit report shows an account with ${creditorName} that does not belong to me. I have never had an account with this creditor. Please remove this unauthorized account.`
      },
      {
        title: "Mixed File Information",
        reason: "Credit file has been mixed with another person",
        instruction: `My credit report shows accounts and information that do not belong to me. I believe my credit file has been mixed with someone else's file. Please investigate and remove all incorrect information.`
      },
      {
        title: "Incomplete Account Information",
        reason: "Account information is incomplete or inaccurate",
        instruction: `The account information for ${creditorName} is incomplete or contains inaccuracies. Please verify all details with the creditor and update or remove if information cannot be verified.`
      }
    ]
  });

  // Get 3 FCRA/FDCPA-based dispute combinations
  const getBestPracticeCombinations = () => {
    const accountStatus = account["@_AccountStatusType"] || "";
    const paymentStatus = account["@_PaymentHistoryProfile"] || "";
    const currentBalance = parseFloat(account["@_CurrentBalance"] || "0");
    const creditorName = account["@_AccountName"] || "this creditor";
    const accountType = account["@_AccountType"] || "";
    
    const templates = getDisputeTemplates(creditorName);
    
    // Determine account category and return appropriate templates
    if (accountStatus.toLowerCase().includes("charged") || 
        (accountStatus.toLowerCase().includes("closed") && currentBalance > 0)) {
      return templates.chargedOff;
    } else if (accountStatus.toLowerCase().includes("collection") || accountType.toLowerCase().includes("collection")) {
      return templates.collection;
    } else if (paymentStatus && paymentStatus.includes("X")) {
      return templates.latePayment;
    } else {
      return templates.general;
    }
  };

  // Apply complete reason/instruction combination with autotype effect
  const applyBestPracticeCombination = (combination: { reason: string; instruction: string }, index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    // Set selected suggestion index to track which one is chosen
    setSelectedSuggestionIndex(index);
    
    // Scroll directly to this account's dispute step using the unique ID
    setTimeout(() => {
      const disputeStepId = `dispute-step-${accountUniqueId}`;
      const disputeElement = document.getElementById(disputeStepId);
      
      if (disputeElement) {
        const rect = disputeElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - 65;
        
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    // Clear current values and prepare for typing
    setSelectedReason('');
    setSelectedInstruction('');
    setCustomReason('');
    setCustomInstruction('');
    setShowCustomReasonField(true);
    setShowCustomInstructionField(true);
    
    // Start typing the reason
    setIsTypingReason(true);
    let reasonIndex = 0;
    
    const typeReason = () => {
      if (reasonIndex < combination.reason.length) {
        setCustomReason(combination.reason.substring(0, reasonIndex + 1));
        reasonIndex++;
        setTimeout(typeReason, 25); // 25ms delay between characters
      } else {
        // Reason typing complete
        setIsTypingReason(false);
        
        // Start typing instruction after brief pause
        setTimeout(() => {
          setIsTypingInstruction(true);
          let instructionIndex = 0;
          
          const typeInstruction = () => {
            if (instructionIndex < combination.instruction.length) {
              setCustomInstruction(combination.instruction.substring(0, instructionIndex + 1));
              instructionIndex++;
              setTimeout(typeInstruction, 15); // Faster for instruction
            } else {
              // Instruction typing complete
              setIsTypingInstruction(false);
              // Check if form is complete after typing is done
              setTimeout(() => {
                checkFormCompletionAndShowArrow(combination.reason, combination.instruction);
              }, 200);
            }
          };
          typeInstruction();
        }, 400); // Brief pause between reason and instruction
      }
    };
    
    typeReason();
  };

  // Check if form is complete and show guide arrow
  const checkFormCompletionAndShowArrow = (overrideReason?: string, overrideInstruction?: string) => {
    // Check both custom fields, typed fields (from Metro 2), and default selections
    const hasReason = customReason.trim() || typedReason.trim() || overrideReason || selectedReason;
    const hasInstruction = customInstruction.trim() || typedInstruction.trim() || overrideInstruction || selectedInstruction;
    const hasSelectedViolations = selectedViolations.length > 0;
    
    console.log("Arrow check - accounts:", {
      hasReason: !!hasReason,
      hasInstruction: !!hasInstruction,
      hasSelectedViolations,
      customReason,
      customInstruction,
      typedReason,
      typedInstruction,
      selectedReason,
      selectedInstruction,
      overrideReason,
      overrideInstruction,
      isDisputeSaved
    });
    
    // Show arrow if form is complete (either with violations OR with dropdown selections)
    if (hasReason && hasInstruction && !isDisputeSaved) {
      console.log("Showing accounts arrow!");
      setShowGuideArrow(true);
      console.log("Arrow state set to true for accounts");
      setTimeout(() => {
        setShowGuideArrow(false);
        console.log("Arrow hidden for accounts");
      }, 4000);
    }
  };
  
  // Status dropdown states for each bureau
  const [transUnionStatus, setTransUnionStatus] = useState<string>("");
  const [equifaxStatus, setEquifaxStatus] = useState<string>("");
  const [experianStatus, setExperianStatus] = useState<string>("");

  // Determine if account is truly negative based on actual JSON data fields
  const isNegative = () => {
    // Primary indicators of negative accounts based on actual JSON structure
    
    // 1. Explicit derogatory data indicator
    if (account["@_DerogatoryDataIndicator"] === "Y") return true;
    
    // 2. Collection accounts
    if (account["@IsCollectionIndicator"] === "Y") return true;
    
    // 3. Charge-off accounts
    if (account["@IsChargeoffIndicator"] === "Y") return true;
    
    // 4. Check for past due amounts (indicates late payments)
    const pastDue = parseInt(account["@_PastDueAmount"] || "0");
    if (pastDue > 0) return true;
    
    // 5. Check current rating code for late payments (2-9 indicate late payments)
    const currentRating = account._CURRENT_RATING?.["@_Code"];
    if (currentRating && ["2", "3", "4", "5", "6", "7", "8", "9"].includes(currentRating)) return true;
    
    // 6. Check for charge-off date
    if (account["@_ChargeOffDate"]) return true;
    
    return false;
  };
  
  const accountIsNegative = isNegative();
  const hasAnyNegative = accountIsNegative;

  // Reset individual account states when expandAll becomes false (Collapse All)
  useEffect(() => {
    if (expandAll === false && !hasAnyNegative) {
      setShowPositiveDetails(false);
      setShowAccountDetails(false);
    }
  }, [expandAll, hasAnyNegative]);

  // Determine if account is closed
  const isClosed = () => {
    // Check for closed account status
    const accountStatus = account["@_AccountStatusType"];
    if (accountStatus && (
      accountStatus.toLowerCase().includes("closed") ||
      accountStatus.toLowerCase().includes("paid") ||
      accountStatus === "C"
    )) return true;
    
    // Check for closed date
    if (account["@_AccountClosedDate"]) return true;
    
    // Check current rating for closed accounts
    const currentRating = account._CURRENT_RATING?.["@_Code"];
    if (currentRating && currentRating === "C") return true;
    
    return false;
  };

  const accountIsClosed = isClosed();

  // Use passed arrays or fallback to consumer-friendly defaults based on common FCRA violations
  const disputeReasons = passedReasons.length > 0 
    ? [...passedReasons, "Add new custom reason"]
    : [
        "This account doesn't belong to me",
        "I already paid this account in full", 
        "The payment history is wrong",
        "The balance amount is incorrect",
        "This account is too old to be reported",
        "I was a victim of identity theft",
        "My mother has the same name as me",
        "My father has the same name as me",
        "My son has the same name as me",
        "Add new custom reason"
      ];

  const disputeInstructions = passedInstructions.length > 0 
    ? [...passedInstructions, "Add new custom instruction"]
    : [
        "Remove this account completely from my credit report immediately",
        "Delete all inaccurate payment history from my credit report",
        "Remove the incorrect balance information from my credit report",
        "Delete this account from my credit report since it's too old to report",
        "Remove this fraudulent account from my credit report due to identity theft",
        "Delete this account that belongs to my family member from my credit report",
        "Remove this account that was discharged in bankruptcy from my credit report",
        "Delete this duplicate account from my credit report",
        "Remove all inaccurate information about this account from my credit report",
        "Add new custom instruction"
      ];

  const statusOptions = [
    "Positive",
    "Negative", 
    "Repaired",
    "Deleted",
    "In Dispute",
    "Verified",
    "Updated",
    "Unspecified",
    "Ignore"
  ];

  // Helper functions to safely extract account data from nested structure
  const getAccountField = (field: string, fallback: string = "N/A") => {
    let value = null;
    
    // Direct field access - try exact field name first
    if (account[field] !== undefined && account[field] !== null && account[field] !== "") {
      value = account[field];
    }
    
    // Handle specific field mappings based on actual JSON structure
    switch (field) {
      case "@_CreditLimitAmount":
        value = account["@_CreditLimitAmount"] || account["@_HighCreditAmount"] || null;
        break;
      case "@_ActualPaymentAmount":
        value = account["@_ActualPaymentAmount"] || account["@_MonthlyPaymentAmount"] || null;
        break;
      case "@_CreditBusinessType":
        value = account["@CreditBusinessType"] || null;
        break;
      case "@_TermsFrequencyType":
        // This field might not exist in many records
        value = account["@_TermsFrequencyType"] || null;
        break;
      case "@_CreditLiabilityAccountReportedDate":
        value = account["@_CreditLiabilityAccountReportedDate"] || account["@_AccountReportedDate"] || null;
        break;
      case "@_Late30DaysCount":
        value = account["_LATE_COUNT"]?.["@_30Days"] || "0";
        break;
      case "@_Late60DaysCount":
        value = account["_LATE_COUNT"]?.["@_60Days"] || "0";
        break;
      case "@_Late90DaysCount":
        value = account["_LATE_COUNT"]?.["@_90Days"] || "0";
        break;
      case "@_PaymentPatternData":
        value = account["_PAYMENT_PATTERN"]?.["@_Data"] || null;
        break;
      case "@_PaymentPatternStartDate":
        value = account["_PAYMENT_PATTERN"]?.["@_StartDate"] || null;
        break;
      case "@_CurrentRatingCode":
        value = account["_CURRENT_RATING"]?.["@_Code"] || null;
        break;
      case "@_CurrentRatingType":
        value = account["_CURRENT_RATING"]?.["@_Type"] || null;
        break;
      case "@_CreditorName":
        value = account["_CREDITOR"]?.["@_Name"] || null;
        break;
      case "@_SubscriberName":
        value = account["@_SubscriberName"] || account["_CREDITOR"]?.["@_Name"] || account["@_CreditorName"] || null;
        break;
      case "@_SubscriberCode":
        value = account["CREDIT_REPOSITORY"]?.["@_SubscriberCode"] || null;
        break;
      case "@_PastDueAmount":
        value = account["@_PastDueAmount"] || "0";
        break;
      case "@_OriginalCreditorName":
        value = account["@_OriginalCreditorName"] || null;
        break;
      case "@_CollectionDate":
        value = account["@CollectionDate"] || null;
        break;
      default:
        // Try nested structures if direct access didn't work
        if (value === null) {
          value = account.CREDIT_LIABILITY_DETAIL?.[field] || 
                  account.CREDIT_COMMENT?.[field] || 
                  null;
        }
        break;
    }
    
    // Return the value if found, otherwise return fallback
    return (value !== null && value !== undefined && value !== "") ? value : fallback;
  };

  // Formatting utilities
  const formatCurrency = (amount: any) => {
    if (!amount || amount === "N/A") return "N/A";
    const num = parseFloat(amount.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? "N/A" : `$${num.toLocaleString()}`;
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const addViolationToDispute = async (violation: string) => {
    console.log("addViolationToDispute called with:", violation);
    if (!selectedViolations.includes(violation)) {
      const newViolations = [...selectedViolations, violation];
      setSelectedViolations(newViolations);
      console.log("Setting new violations:", newViolations);
      
      // Auto-populate text fields when violations are added
      const isFirstViolation = selectedViolations.length === 0;
      
      // Create structured compliance reason with all violations
      const complianceReason = `This tradeline contains ${newViolations.length > 1 ? 'multiple ' : ''}compliance violations under Metro 2 and the FCRA:
${newViolations.map(v => {
  if (v.includes('Metro 2')) {
    return `• Metro 2 Violation: ${v.replace('Metro 2 Violation: ', '')}`;
  } else if (v.includes('FCRA')) {
    return `• FCRA Violation: ${v.replace('FCRA Violation: ', '')} under FCRA § 623`;
  }
  return `• ${v}`;
}).join('\n')}

Due to these reporting inaccuracies and regulatory violations, I am requesting the permanent deletion of this tradeline from my credit report.`;
      
      const complianceInstruction = "Please take immediate action to remove this non-compliant account in accordance with Metro 2 and FCRA requirements. If reinvestigation cannot verify accuracy within 30 days, permanent deletion is required under 15 USC §1681i(a)(1).";
      
      if (isFirstViolation) {
        // First violation - use typing animation
        console.log("Starting typing animation for first violation");
        setHasAiGeneratedText(true);
        // Switch to custom text mode
        setShowCustomReasonField(true);
        setShowCustomInstructionField(true);
        setSelectedReason("");
        setSelectedInstruction("");
        setTimeout(async () => {
          await typeText(complianceReason, setCustomReason, setIsTypingReason, 3);
          console.log("First field typed, customReason should be:", complianceReason.substring(0, 50));
          await new Promise(resolve => setTimeout(resolve, 75));
          await typeText(complianceInstruction, setCustomInstruction, setIsTypingInstruction, 4);
          console.log("Second field typed, customInstruction should be:", complianceInstruction.substring(0, 50));
          // Check for arrow after both fields are typed
          console.log("Typing complete, checking for arrow");
          setTimeout(() => {
            checkFormCompletionAndShowArrow(complianceReason, complianceInstruction);
          }, 500);
        }, 150);
      } else {
        // Additional violations - update text instantly
        console.log("Setting violation text instantly");
        setHasAiGeneratedText(true);
        setCustomReason(complianceReason);
        setCustomInstruction(complianceInstruction);
        // Check for arrow after instant update
        setTimeout(() => checkFormCompletionAndShowArrow(complianceReason, complianceInstruction), 100);
      }
    }
  };

  const removeViolationFromDispute = (violation: string) => {
    const newViolations = selectedViolations.filter(v => v !== violation);
    setSelectedViolations(newViolations);
    
    // Update text fields to reflect remaining violations
    if (newViolations.length === 0) {
      // No violations left - clear the fields
      setCustomReason("");
      setCustomInstruction("");
    } else {
      // Update text with remaining violations
      const complianceReason = `This tradeline contains ${newViolations.length > 1 ? 'multiple ' : ''}compliance violations under Metro 2 and the FCRA:
${newViolations.map(v => {
  if (v.includes('Metro 2')) {
    return `• Metro 2 Violation: ${v.replace('Metro 2 Violation: ', '')}`;
  } else if (v.includes('FCRA')) {
    return `• FCRA Violation: ${v.replace('FCRA Violation: ', '')} under FCRA § 623`;
  }
  return `• ${v}`;
}).join('\n')}

Due to these reporting inaccuracies and regulatory violations, I am requesting the permanent deletion of this tradeline from my credit report.`;
      
      const complianceInstruction = "Please take immediate action to remove this non-compliant account in accordance with Metro 2 and FCRA requirements. If reinvestigation cannot verify accuracy within 30 days, permanent deletion is required under 15 USC §1681i(a)(1).";
      
      setCustomReason(complianceReason);
      setCustomInstruction(complianceInstruction);
    }
    
    // Check for arrow after updating violation text
    setTimeout(() => checkFormCompletionAndShowArrow(), 100);
  };



  // Typing animation function
  const typeText = async (text: string, setter: (value: string) => void, isTypingSetter: (value: boolean) => void, speed: number = 30) => {
    console.log("typeText starting with text:", text.substring(0, 50) + "...");
    isTypingSetter(true);
    setter("");
    
    for (let i = 0; i <= text.length; i++) {
      setter(text.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    
    console.log("typeText completed, final text:", text.substring(0, 50) + "...");
    isTypingSetter(false);
  };

  const addAllViolations = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedViolations([...aiViolations]);
    
    // Create structured compliance reason with improved format
    const complianceReason = `This tradeline contains multiple compliance violations under Metro 2 and the FCRA:
${aiViolations.map(violation => {
  if (violation.includes('Metro 2')) {
    return `• Metro 2 Violation: ${violation.replace('Metro 2 Violation: ', '')}`;
  } else if (violation.includes('FCRA')) {
    return `• FCRA Violation: ${violation.replace('FCRA Violation: ', '')} under FCRA § 623`;
  }
  return `• ${violation}`;
}).join('\n')}

Due to these reporting inaccuracies and regulatory violations, I am requesting the permanent deletion of this tradeline from my credit report.`;
    
    const complianceInstruction = "Please take immediate action to remove this non-compliant account in accordance with Metro 2 and FCRA requirements. If reinvestigation cannot verify accuracy within 30 days, permanent deletion is required under 15 USC §1681i(a)(1).";
    
    // Switch to custom text mode
    setShowCustomReasonField(true);
    setShowCustomInstructionField(true);
    setSelectedReason("");
    setSelectedInstruction("");
    
    // Scroll to step 2 circle (numbered guidance)
    const currentCard = event.currentTarget.closest('[data-account-id]');
    if (currentCard) {
      // Look for the step 2 circle by finding all blue circles and checking their text content
      const blueCircles = Array.from(currentCard.querySelectorAll('.bg-blue-600'));
      let step2Element = null;
      
      for (const circle of blueCircles) {
        if (circle.textContent && circle.textContent.trim() === '2') {
          step2Element = circle;
          break;
        }
      }
      
      if (step2Element) {
        const step2Rect = step2Element.getBoundingClientRect();
        const scrollTop = window.pageYOffset + step2Rect.top - 65; // 65px above step 2
        
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
    
    // Wait a moment then start typing animations
    setTimeout(async () => {
      // Type reason first
      await typeText(complianceReason, setCustomReason, setIsTypingReason, 3);
      
      // Small pause between reason and instruction
      await new Promise(resolve => setTimeout(resolve, 75));
      
      // Then type instruction
      await typeText(complianceInstruction, setCustomInstruction, setIsTypingInstruction, 4);
      
      // Check for arrow after both fields are typed
      setTimeout(() => checkFormCompletionAndShowArrow(complianceReason, complianceInstruction), 500);
    }, 150);
  };

  // Get creditor name exactly like the main section
  const getCreditorName = () => {
    return account["_CREDITOR"]?.["@_Name"] || account["@_SubscriberCode"] || "Unknown Creditor";
  };

  // Format account details for display
  const formatAccountDetails = () => {
    const details: { [key: string]: any } = {};
    Object.keys(account).forEach(key => {
      if (key.startsWith('@') && account[key] !== null && account[key] !== undefined && account[key] !== '') {
        const cleanKey = key.replace('@_', '').replace('@', '');
        details[cleanKey] = account[key];
      }
    });
    return details;
  };

  // Convert status codes to readable descriptions
  const getStatusDescription = (statusCode: string) => {
    const statusMap: { [key: string]: string } = {
      "1": "Current/Pays as Agreed",
      "2": "30 Days Late",
      "3": "60 Days Late", 
      "4": "90 Days Late",
      "5": "120+ Days Late",
      "7": "Making Payments Under Wage Earner Plan",
      "8": "Repossession",
      "9": "Charged Off/Bad Debt",
      "G": "Collection Account",
      "L": "Settled for Less Than Full Balance",
      "R": "Refinanced",
      "C": "Closed",
      "O": "Open",
      "U": "Unrated"
    };
    return statusMap[statusCode] || `Status ${statusCode}`;
  };

  // Use authentic data from JSON - no synthetic variations
  const getBureauData = () => {
    const realBalance = parseInt(account["@_UnpaidBalanceAmount"] || account["@_CurrentBalance"] || "0");
    const realStatus = account._CURRENT_RATING?.["@_Code"] || "1";
    const realDate = account["@_AccountOpenedDate"] || "2020-01-01";
    const reportingBureau = account.CREDIT_REPOSITORY?.["@_SourceType"] || "Unknown";
    
    // Use the same authentic data for all bureaus since we only have one record per account
    return {
      transUnion: {
        balance: realBalance,
        statusCode: realStatus,
        status: getStatusDescription(realStatus),
        openDate: realDate,
        isNegative: false, // Will be determined by isCurrentlyNegative function
        lastUpdated: account["@_AccountReportedDate"] || "2024-01-01",
        reportingBureau: reportingBureau === "TransUnion" ? reportingBureau : "Not Reporting"
      },
      equifax: {
        balance: realBalance,
        statusCode: realStatus,
        status: getStatusDescription(realStatus),
        openDate: realDate,
        isNegative: false, // Will be determined by isCurrentlyNegative function
        lastUpdated: account["@_AccountReportedDate"] || "2024-01-01",
        reportingBureau: reportingBureau === "Equifax" ? reportingBureau : "Not Reporting"
      },
      experian: {
        balance: realBalance,
        statusCode: realStatus,
        status: getStatusDescription(realStatus),
        openDate: realDate,
        isNegative: false, // Will be determined by isCurrentlyNegative function
        lastUpdated: account["@_AccountReportedDate"] || "2024-01-01",
        reportingBureau: reportingBureau === "Experian" ? reportingBureau : "Not Reporting"
      }
    };
  };

  const bureauData = getBureauData();

  // Helper function to get consistent account number from JSON data
  const getAccountNumber = () => {
    // Use the actual account number from the JSON data
    return String(account["@_AccountNumber"] || account["@CreditLiabilityID"] || "0000");
  };

  const getMaskedAccountNumber = () => {
    const fullNumber = getAccountNumber();
    return `****${fullNumber.slice(-4)}`;
  };

  const getPaymentStatusStyle = (status: string) => {
    const negativeStatuses = ['30 Days Late', '60 Days Late', '90 Days Late', '120 Days Late', 'Charge Off', 'Collection', 'Late', 'Past Due'];
    const isNegative = negativeStatuses.some(negStatus => status.includes(negStatus) || status.toLowerCase().includes('late') || status.toLowerCase().includes('past due') || status.toLowerCase().includes('charge') || status.toLowerCase().includes('collection'));
    return isNegative ? 'text-red-600 font-medium' : 'text-gray-900';
  };

  const isNegativeAccount = (status: string) => {
    const negativeStatuses = ['30 Days Late', '60 Days Late', '90 Days Late', '120 Days Late', 'Charge Off', 'Collection', 'Late', 'Past Due'];
    return negativeStatuses.some(negStatus => status.includes(negStatus) || status.toLowerCase().includes('late') || status.toLowerCase().includes('past due') || status.toLowerCase().includes('charge') || status.toLowerCase().includes('collection'));
  };

  const getAccountDataStyle = (status: string) => {
    return isNegativeAccount(status) ? 'text-red-600' : 'text-gray-900';
  };

  // For positive and closed accounts, show collapsed view by default (unless expandAll is true)
  if (!hasAnyNegative && !showPositiveDetails && !expandAll) {
    const isClosedAccount = accountIsClosed && !accountIsNegative;
    const ballColor = isClosedAccount ? "bg-gray-500" : "bg-green-500";
    const textColor = isClosedAccount ? "text-gray-600" : "text-green-600";
    const statusText = isClosedAccount ? "Closed" : "In Good Standing";
    
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-4">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
            onClick={() => setShowPositiveDetails(true)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 ${ballColor} rounded-full`}></div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {account._CREDITOR?.["@_Name"] || account.CREDIT_BUSINESS?.["@_Name"] || "Unknown Creditor"}
                </h3>
                <p className={`text-sm ${textColor} font-medium`}>{statusText}</p>
              </div>
            </div>
            {/* Arrow icon for positive/closed accounts */}
            <div className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`transition-all duration-300 shadow-sm rounded-lg border hover:shadow-md ${
        isDisputeSaved 
          ? 'border-green-200 bg-green-50/50' 
          : hasAnyNegative 
            ? 'border-red-200 bg-red-50' 
            : 'border-gray-200 bg-white'
      }`}
      style={{
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
      }}
      data-account-id={account["@CreditLiabilityID"] || account["@_AccountNumber"] || "unknown"}
      data-highlight-target={hasAnyNegative ? "true" : "false"}
    >
      <CardContent className={`px-6 ${hasAnyNegative ? 'pt-6 pb-6' : 'pt-1 pb-2'}`}>
        
        {/* Up arrow for positive accounts when expanded */}
        {!hasAnyNegative && (showPositiveDetails || expandAll) && (
          <div className="flex items-center justify-between mb-4 -mx-2">
            <div></div>
            {!expandAll && (
              <button
                onClick={() => setShowPositiveDetails(false)}
                className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
            {expandAll && <div className="w-8 h-8"></div>}
          </div>
        )}
        
        {/* Numbered guidance for negative accounts only */}
        {hasAnyNegative && (
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center justify-center w-6 h-6 md:w-5 md:h-5 text-white text-sm font-black rounded-full transition-colors duration-300 flex-shrink-0 ${
              isDisputeSaved ? 'bg-green-600' : 'bg-blue-600'
            }`}>
              {isDisputeSaved ? '✓' : '1'}
            </span>
            <span className="font-bold">
              {isDisputeSaved ? 'Account dispute completed' : 'Review this negative item, then scroll down to steps 2 and 3'}
            </span>
          </div>
        )}

        {/* Account Header */}
        <div className="mb-4">
          {/* Mobile: No standalone button here anymore */}

          {/* Desktop: Show all three bureau headers */}
          <div className="hidden md:block relative">
            {/* Invisible clickable area above bureau headers - aligned with up arrow */}
            {!hasAnyNegative && showPositiveDetails && !expandAll && (
              <div 
                className="absolute -top-8 left-0 right-0 h-12 cursor-pointer hover:bg-gray-100 hover:bg-opacity-30 rounded-t-lg transition-colors z-10"
                onClick={() => setShowPositiveDetails(false)}
              />
            )}
            
            <div className="flex items-center justify-between mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-cyan-700">TransUnion</h3>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-red-600">Equifax</h3>
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-blue-700">Experian</h3>
                </div>
              </div>
              

            </div>
          </div>
        </div>
        
        {/* Mobile Show All Info Button */}
        <div className="block md:hidden mb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-cyan-700 text-left">TransUnion</h3>
            <Dialog open={showMobileModal} onOpenChange={setShowMobileModal}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center px-2 py-1 text-xs h-6"
                >
                  Show All Info
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  Complete Account Details
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Complete account information across all three bureaus
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* TransUnion Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-cyan-700 mb-1">TransUnion</h4>
                  <h3 className="font-bold text-gray-900 text-lg mb-3">{getAccountField("@_SubscriberName") || getCreditorName()}</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {isPublicRecord() ? (
                      // Public Record Fields
                      <>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Record Type:</span>
                          <span className="text-gray-900">{account.publicRecordType || "Public Record"}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Court:</span>
                          <span className="text-gray-900">{account.courtName || account["@_SubscriberName"]}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Case Number:</span>
                          <span className="text-gray-900">{account.caseNumber || account["@_AccountIdentifier"]}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Filing Date:</span>
                          <span className="text-gray-900">{formatDate(account.filingDate || account["@_AccountOpenedDate"])}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Status:</span>
                          <span className="text-red-600 font-medium">{account.status || account["@_AccountStatusType"]}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Liabilities:</span>
                          <span className="text-gray-900">{account.liabilities || formatCurrency(account["@_UnpaidBalanceAmount"])}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Assets:</span>
                          <span className="text-gray-900">{account.assets || "N/A"}</span>
                        </div>
                        {account.dischargeDate && (
                          <div className="flex justify-between border-b border-cyan-100 pb-1">
                            <span className="font-medium text-gray-600">Discharge Date:</span>
                            <span className="text-gray-900">{formatDate(account.dischargeDate)}</span>
                          </div>
                        )}
                        {account.completionDate && (
                          <div className="flex justify-between border-b border-cyan-100 pb-1">
                            <span className="font-medium text-gray-600">Completion Date:</span>
                            <span className="text-gray-900">{formatDate(account.completionDate)}</span>
                          </div>
                        )}
                        {account.paymentPlan && (
                          <div className="flex justify-between border-b border-cyan-100 pb-1">
                            <span className="font-medium text-gray-600">Payment Plan:</span>
                            <span className="text-gray-900">{account.paymentPlan}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      // Regular Account Fields
                      <>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Account Type:</span>
                          <span className="text-gray-900 text-sm">{account["@_AccountType"] || "Credit Card"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Account #:</span>
                          <span className="text-gray-900 text-sm">{getMaskedAccountNumber()}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Date Opened:</span>
                          <span className="text-gray-900 text-sm">{formatDate(getAccountField("@_AccountOpenedDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Payment Status:</span>
                          <span className={`text-sm ${getPaymentStatusStyle(bureauData.transUnion.status)}`}>{bureauData.transUnion.status}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Credit Limit:</span>
                          <span className="text-gray-900 text-sm">{formatCurrency(getAccountField("@_CreditLimitAmount"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Balance:</span>
                          <span className="text-gray-900 text-sm">${bureauData.transUnion.balance}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Monthly Payment:</span>
                          <span className="text-gray-900 text-sm">{formatCurrency(getAccountField("@_MonthlyPaymentAmount"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">High Balance:</span>
                          <span className="text-gray-900 text-sm">{formatCurrency(getAccountField("@_HighBalanceAmount"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Past Due:</span>
                          <span className="text-gray-900 text-sm">{formatCurrency(getAccountField("@_PastDueAmount", "0"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Last Activity:</span>
                          <span className="text-gray-900 text-sm">{formatDate(getAccountField("@_LastActivityDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Date Reported:</span>
                          <span className="text-gray-900 text-sm">{formatDate(getAccountField("@_AccountBalanceDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Late 30 Days:</span>
                          <span className="text-gray-900 text-sm">{getAccountField("@_Late30DaysCount", "0")}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Late 60 Days:</span>
                          <span className="text-gray-900 text-sm">{getAccountField("@_Late60DaysCount", "0")}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                          <span className="font-medium text-gray-700 text-sm">Late 90+ Days:</span>
                          <span className="text-gray-900 text-sm">{getAccountField("@_Late90DaysCount", "0")}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Account Status Date:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_AccountStatusDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Last Payment Date:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_LastPaymentDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Date Closed:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_AccountClosedDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-cyan-100 pb-1">
                          <span className="font-medium text-gray-600">Terms:</span>
                          <span className="text-gray-900">{getAccountField("@_TermsDescription")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Ownership:</span>
                          <span className="text-gray-900">{getAccountField("@_AccountOwnershipType")}</span>
                        </div>
                        
                        {/* Payment History */}
                        <div className="mt-3 pt-3 border-t border-cyan-200">
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-600">Payment History:</span>
                          </div>
                          <PaymentHistoryVisual 
                            paymentPattern={account["_PAYMENT_PATTERN"]?.["@_Data"] || "CCCCCCCCCCCCCCCCCCCCCCC"} 
                            compact={true}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Equifax Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-red-600 mb-1">Equifax</h4>
                  <h3 className="font-bold text-gray-900 text-lg mb-3">{getAccountField("@_SubscriberName") || getCreditorName()}</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {isPublicRecord() ? (
                      // Public Record Fields
                      <>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Record Type:</span>
                          <span className="text-gray-900">{account.publicRecordType || "Public Record"}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Court:</span>
                          <span className="text-gray-900">{account.courtName || account["@_SubscriberName"]}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Case Number:</span>
                          <span className="text-gray-900">{account.caseNumber || account["@_AccountIdentifier"]}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Filing Date:</span>
                          <span className="text-gray-900">{formatDate(account.filingDate || account["@_AccountOpenedDate"])}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Status:</span>
                          <span className="text-red-600 font-medium">{account.status || account["@_AccountStatusType"]}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Liabilities:</span>
                          <span className="text-gray-900">{account.liabilities || formatCurrency(account["@_UnpaidBalanceAmount"])}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Assets:</span>
                          <span className="text-gray-900">{account.assets || "N/A"}</span>
                        </div>
                        {account.dischargeDate && (
                          <div className="flex justify-between border-b border-red-100 pb-1">
                            <span className="font-medium text-gray-600">Discharge Date:</span>
                            <span className="text-gray-900">{formatDate(account.dischargeDate)}</span>
                          </div>
                        )}
                        {account.completionDate && (
                          <div className="flex justify-between border-b border-red-100 pb-1">
                            <span className="font-medium text-gray-600">Completion Date:</span>
                            <span className="text-gray-900">{formatDate(account.completionDate)}</span>
                          </div>
                        )}
                        {account.paymentPlan && (
                          <div className="flex justify-between border-b border-red-100 pb-1">
                            <span className="font-medium text-gray-600">Payment Plan:</span>
                            <span className="text-gray-900">{account.paymentPlan}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      // Regular Account Fields
                      <>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Account Type:</span>
                          <span className="text-gray-900">{account["@_AccountType"] || "Credit Card"}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Account #:</span>
                          <span className="text-gray-900">{getMaskedAccountNumber()}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Date Opened:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_AccountOpenedDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Payment Status:</span>
                          <span className={`text-gray-900 ${getPaymentStatusStyle(bureauData.equifax.status)}`}>{bureauData.equifax.status}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Credit Limit:</span>
                          <span className="text-gray-900">{formatCurrency(getAccountField("@_CreditLimitAmount"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Balance:</span>
                          <span className="text-gray-900">${bureauData.equifax.balance}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Monthly Payment:</span>
                          <span className="text-gray-900">{formatCurrency(getAccountField("@_MonthlyPaymentAmount"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">High Balance:</span>
                          <span className="text-gray-900">{formatCurrency(getAccountField("@_HighBalanceAmount"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Past Due:</span>
                          <span className="text-gray-900">{formatCurrency(getAccountField("@_PastDueAmount", "0"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Last Activity:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_LastActivityDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Date Reported:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_AccountBalanceDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Late 30 Days:</span>
                          <span className="text-gray-900">{getAccountField("@_Late30DaysCount", "0")}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Late 60 Days:</span>
                          <span className="text-gray-900">{getAccountField("@_Late60DaysCount", "0")}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Late 90+ Days:</span>
                          <span className="text-gray-900">{getAccountField("@_Late90DaysCount", "0")}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Account Status Date:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_AccountStatusDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Last Payment Date:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_LastPaymentDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Date Closed:</span>
                          <span className="text-gray-900">{formatDate(getAccountField("@_AccountClosedDate"))}</span>
                        </div>
                        <div className="flex justify-between border-b border-red-100 pb-1">
                          <span className="font-medium text-gray-600">Terms:</span>
                          <span className="text-gray-900">{getAccountField("@_TermsDescription")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Ownership:</span>
                          <span className="text-gray-900">{getAccountField("@_AccountOwnershipType")}</span>
                        </div>
                        
                        {/* Payment History */}
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-600">Payment History:</span>
                          </div>
                          <PaymentHistoryVisual 
                            paymentPattern={account["_PAYMENT_PATTERN"]?.["@_Data"] || "CCCCCCCCCCCCCCCCCCCCCCC"} 
                            compact={true}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Experian Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-700 mb-1">Experian</h4>
                  <h3 className="font-bold text-gray-900 text-lg mb-3">{getAccountField("@_SubscriberName") || getCreditorName()}</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Account Type:</span>
                      <span className="text-gray-900">{account["@_AccountType"] || "Credit Card"}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Account #:</span>
                      <span className="text-gray-900">{getMaskedAccountNumber()}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Date Opened:</span>
                      <span className="text-gray-900">{formatDate(getAccountField("@_AccountOpenedDate"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Payment Status:</span>
                      <span className={`text-gray-900 ${getPaymentStatusStyle(bureauData.experian.status)}`}>{bureauData.experian.status}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Credit Limit:</span>
                      <span className="text-gray-900">{formatCurrency(getAccountField("@_CreditLimitAmount"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Balance:</span>
                      <span className="text-gray-900">${bureauData.experian.balance}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Monthly Payment:</span>
                      <span className="text-gray-900">{formatCurrency(getAccountField("@_MonthlyPaymentAmount"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">High Balance:</span>
                      <span className="text-gray-900">{formatCurrency(getAccountField("@_HighBalanceAmount"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Past Due:</span>
                      <span className="text-gray-900">{formatCurrency(getAccountField("@_PastDueAmount", "0"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Last Activity:</span>
                      <span className="text-gray-900">{formatDate(getAccountField("@_LastActivityDate"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Date Reported:</span>
                      <span className="text-gray-900">{formatDate(getAccountField("@_AccountBalanceDate"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Late 30 Days:</span>
                      <span className="text-gray-900">{getAccountField("@_Late30DaysCount", "0")}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Late 60 Days:</span>
                      <span className="text-gray-900">{getAccountField("@_Late60DaysCount", "0")}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Late 90+ Days:</span>
                      <span className="text-gray-900">{getAccountField("@_Late90DaysCount", "0")}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Account Status Date:</span>
                      <span className="text-gray-900">{formatDate(getAccountField("@_AccountStatusDate"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Last Payment Date:</span>
                      <span className="text-gray-900">{formatDate(getAccountField("@_LastPaymentDate"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Date Closed:</span>
                      <span className="text-gray-900">{formatDate(getAccountField("@_AccountClosedDate"))}</span>
                    </div>
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span className="font-medium text-gray-600">Terms:</span>
                      <span className="text-gray-900">{getAccountField("@_TermsDescription")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Ownership:</span>
                      <span className="text-gray-900">{getAccountField("@_AccountOwnershipType")}</span>
                    </div>
                    
                    {/* Payment History */}
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Payment History:</span>
                      </div>
                      <PaymentHistoryVisual 
                        paymentPattern={account["_PAYMENT_PATTERN"]?.["@_Data"] || "CCCCCCCCCCCCCCCCCCCCCCC"} 
                        compact={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bureau Comparison Grid - Full Width */}
        <div className={`grid grid-cols-1 md:grid-cols-3 mb-4 ${isFirstCopy ? 'gap-6' : 'gap-4'}`}>
          {/* TransUnion */}
          <div className="relative">

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-black">{getCreditorName()}</h4>
              <Select value={transUnionStatus || (accountIsNegative ? "Negative" : "Positive")} onValueChange={setTransUnionStatus}>
                <SelectTrigger className={`w-24 h-7 text-xs transform translate-x-[10px] [&>svg]:w-3 [&>svg]:h-3 [&>svg]:opacity-100 [&>svg]:shrink-0 border-0 bg-transparent shadow-none hover:bg-gray-50 ${
                  (transUnionStatus || (accountIsNegative ? "Negative" : "Positive")) === "Negative" 
                    ? "text-gray-700 [&>svg]:text-gray-700" 
                    : "text-green-700 [&>svg]:text-green-600"
                }`}>
                  <div className="flex items-center gap-1">
                    {(transUnionStatus || (accountIsNegative ? "Negative" : "Positive")) === "Negative" && (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {(transUnionStatus || (accountIsNegative ? "Negative" : "Positive")) === "Positive" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-xs">
              {/* Basic 5 lines - always visible */}
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type:</span>
                <span className="font-medium">{account["@_AccountType"] || "Credit Card"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account #:</span>
                <span className="font-medium">{getMaskedAccountNumber()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance:</span>
                <span className="font-medium">${bureauData.transUnion.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${getPaymentStatusStyle(bureauData.transUnion.status)}`}>{bureauData.transUnion.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updated:</span>
                <span className="font-medium">{bureauData.transUnion.lastUpdated}</span>
              </div>
              
              {/* Comprehensive details - only visible when toggle is active or expandAll is true */}
              {(showAccountDetails || expandAll) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Opened:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountOpenedDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Limit:</span>
                    <span className="font-medium">{formatCurrency(getAccountField("@_CreditLimitAmount"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span className="font-medium">{formatCurrency(getAccountField("@_MonthlyPaymentAmount"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High Balance:</span>
                    <span className="font-medium">{formatCurrency(getAccountField("@_HighBalanceAmount"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Past Due:</span>
                    <span className="font-medium">{formatCurrency(getAccountField("@_PastDueAmount", "0"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_LastActivityDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Reported:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountBalanceDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actual Payment Amount:</span>
                    <span className="font-medium">{formatCurrency(getAccountField("@_ActualPaymentAmount"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Ownership:</span>
                    <span className="font-medium">{getAccountField("@_AccountOwnershipType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creditor Classification:</span>
                    <span className="font-medium">{getAccountField("@_CreditBusinessType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms Duration:</span>
                    <span className="font-medium">{getAccountField("@_TermsMonthsCount")} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms Frequency:</span>
                    <span className="font-medium">{getAccountField("@_TermsFrequencyType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountStatusDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Payment Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_LastPaymentDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Closed Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountClosedDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Verified:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_CreditLiabilityAccountReportedDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms:</span>
                    <span className="font-medium">{getAccountField("@_TermsDescription")}</span>
                  </div>
                  
                  {/* Payment History for TransUnion */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="mb-2">
                      <span className="text-gray-600 text-xs font-medium">Payment History:</span>
                    </div>
                    <PaymentHistoryVisual 
                      paymentPattern={account["_PAYMENT_PATTERN"]?.["@_Data"] || "CCCCCCCCCCCCCCCCCCCCCCC"} 
                      compact={true}
                    />
                  </div>
                </>
              )}
            </div>
            </div>
          </div>

          {/* Equifax */}
          <div>
            {/* Mobile Bureau Header - Above Box */}
            <div className="block md:hidden mb-2">
              <h3 className="font-bold text-red-600 text-left">Equifax</h3>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-black">{getCreditorName()}</h4>
              <Select value={equifaxStatus || (accountIsNegative ? "Negative" : "Positive")} onValueChange={setEquifaxStatus}>
                <SelectTrigger className={`w-24 h-7 text-xs transform translate-x-[10px] [&>svg]:w-3 [&>svg]:h-3 [&>svg]:opacity-100 [&>svg]:shrink-0 border-0 bg-transparent shadow-none hover:bg-gray-50 ${
                  (equifaxStatus || (accountIsNegative ? "Negative" : "Positive")) === "Negative" 
                    ? "text-gray-700 [&>svg]:text-gray-700" 
                    : "text-green-700 [&>svg]:text-green-600"
                }`}>
                  <div className="flex items-center gap-1">
                    {(equifaxStatus || (accountIsNegative ? "Negative" : "Positive")) === "Negative" && (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {(equifaxStatus || (accountIsNegative ? "Negative" : "Positive")) === "Positive" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-xs">
              {/* Basic 5 lines - always visible */}
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type:</span>
                <span className="font-medium">{account["@_AccountType"] || "Credit Card"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account #:</span>
                <span className="font-medium">{getMaskedAccountNumber()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance:</span>
                <span className="font-medium">${bureauData.equifax.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${getPaymentStatusStyle(bureauData.equifax.status)}`}>{bureauData.equifax.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updated:</span>
                <span className="font-medium">{bureauData.equifax.lastUpdated}</span>
              </div>
              
              {/* Comprehensive details - only visible when toggle is active or expandAll is true */}
              {(showAccountDetails || expandAll) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Opened:</span>
                    <span className="font-medium">{account["@_AccountOpenedDate"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Limit:</span>
                    <span className="font-medium">${account["@_CreditLimitAmount"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span className="font-medium">${account["@_MonthlyPaymentAmount"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High Balance:</span>
                    <span className="font-medium">${account["@_HighBalanceAmount"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Past Due:</span>
                    <span className="font-medium">${account["@_PastDueAmount"] || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_LastActivityDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Reported:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountBalanceDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actual Payment Amount:</span>
                    <span className="font-medium">{formatCurrency(getAccountField("@_ActualPaymentAmount"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Ownership:</span>
                    <span className="font-medium">{getAccountField("@_AccountOwnershipType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creditor Classification:</span>
                    <span className="font-medium">{getAccountField("@_CreditBusinessType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms Duration:</span>
                    <span className="font-medium">{getAccountField("@_TermsMonthsCount")} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms Frequency:</span>
                    <span className="font-medium">{getAccountField("@_TermsFrequencyType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountStatusDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Payment Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_LastPaymentDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Closed Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountClosedDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Verified:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_CreditLiabilityAccountReportedDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms:</span>
                    <span className="font-medium">{getAccountField("@_TermsDescription")}</span>
                  </div>
                  
                  {/* Payment History for Equifax */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="mb-2">
                      <span className="text-gray-600 text-xs font-medium">Payment History:</span>
                    </div>
                    <PaymentHistoryVisual 
                      paymentPattern={account["_PAYMENT_PATTERN"]?.["@_Data"] || "CCCCCCCCCCCCCCCCCCCCCCC"} 
                      compact={true}
                    />
                  </div>
                </>
              )}
            </div>
            </div>
          </div>

          {/* Experian */}
          <div>
            {/* Mobile Bureau Header - Above Box */}
            <div className="block md:hidden mb-2">
              <h3 className="font-bold text-blue-700 text-left">Experian</h3>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-black">{getCreditorName()}</h4>
              <Select value={experianStatus || (accountIsNegative ? "Negative" : "Positive")} onValueChange={setExperianStatus}>
                <SelectTrigger className={`w-24 h-7 text-xs transform translate-x-[10px] [&>svg]:w-3 [&>svg]:h-3 [&>svg]:opacity-100 [&>svg]:shrink-0 border-0 bg-transparent shadow-none hover:bg-gray-50 ${
                  (experianStatus || (accountIsNegative ? "Negative" : "Positive")) === "Negative" 
                    ? "text-gray-700 [&>svg]:text-gray-700" 
                    : "text-green-700 [&>svg]:text-green-600"
                }`}>
                  <div className="flex items-center gap-1">
                    {(experianStatus || (accountIsNegative ? "Negative" : "Positive")) === "Negative" && (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {(experianStatus || (accountIsNegative ? "Negative" : "Positive")) === "Positive" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-xs">
              {/* Basic 5 lines - always visible */}
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type:</span>
                <span className="font-medium">{account["@_AccountType"] || "Credit Card"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account #:</span>
                <span className="font-medium">{getMaskedAccountNumber()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance:</span>
                <span className="font-medium">${bureauData.experian.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${getPaymentStatusStyle(bureauData.experian.status)}`}>{bureauData.experian.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updated:</span>
                <span className="font-medium">{bureauData.experian.lastUpdated}</span>
              </div>
              
              {/* Comprehensive details - only visible when toggle is active or expandAll is true */}
              {(showAccountDetails || expandAll) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Opened:</span>
                    <span className="font-medium">{account["@_AccountOpenedDate"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Limit:</span>
                    <span className="font-medium">${account["@_CreditLimitAmount"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span className="font-medium">${account["@_MonthlyPaymentAmount"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">High Balance:</span>
                    <span className="font-medium">${account["@_HighBalanceAmount"] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Past Due:</span>
                    <span className="font-medium">${account["@_PastDueAmount"] || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_LastActivityDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Reported:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountBalanceDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actual Payment Amount:</span>
                    <span className="font-medium">{formatCurrency(getAccountField("@_ActualPaymentAmount"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Ownership:</span>
                    <span className="font-medium">{getAccountField("@_AccountOwnershipType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creditor Classification:</span>
                    <span className="font-medium">{getAccountField("@_CreditBusinessType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms Duration:</span>
                    <span className="font-medium">{getAccountField("@_TermsMonthsCount")} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms Frequency:</span>
                    <span className="font-medium">{getAccountField("@_TermsFrequencyType")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountStatusDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Payment Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_LastPaymentDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Closed Date:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_AccountClosedDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Verified:</span>
                    <span className="font-medium">{formatDate(getAccountField("@_CreditLiabilityAccountReportedDate"))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terms:</span>
                    <span className="font-medium">{getAccountField("@_TermsDescription")}</span>
                  </div>
                  
                  {/* Payment History for Experian */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="mb-2">
                      <span className="text-gray-600 text-xs font-medium">Payment History:</span>
                    </div>
                    <PaymentHistoryVisual 
                      paymentPattern={account["_PAYMENT_PATTERN"]?.["@_Data"] || "CCCCCCCCCCCCCCCCCCCCCCC"} 
                      compact={true}
                    />
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Show All Info Toggle Button - Desktop Only - Hide when expandAll is active */}
        {!expandAll && (
          <div className="hidden md:flex justify-center -mt-2 mb-0 relative w-full">
            <button
              onClick={() => setShowAccountDetails(!showAccountDetails)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              {/* For all accounts, show text with arrow */}
              <span>{showAccountDetails ? 'Hide Details' : 'More Details'}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showAccountDetails ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* AI Violations Alert (if any) */}
        {aiViolations.length > 0 && (
          <div style={{ marginTop: '-8px' }}>
            <button
              onClick={() => setShowViolations(!showViolations)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-2 rounded-md transition-colors font-medium"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">
                View {aiViolations.length} Compliance Violations
                {(() => {
                  const metro2Count = aiViolations.filter(v => v.includes('Metro 2')).length;
                  const fcrCount = aiViolations.length - metro2Count;
                  if (metro2Count > 0 && fcrCount > 0) {
                    return ` (${metro2Count} Metro 2, ${fcrCount} FCRA)`;
                  } else if (metro2Count > 0) {
                    return ` (${metro2Count} Metro 2)`;
                  } else if (fcrCount > 0) {
                    return ` (${fcrCount} FCRA)`;
                  }
                  return '';
                })()}
              </span>
              <span className="md:hidden font-medium">
                View {aiViolations.length} Violations
                {(() => {
                  const metro2Count = aiViolations.filter(v => v.includes('Metro 2')).length;
                  const fcrCount = aiViolations.length - metro2Count;
                  if (metro2Count > 0 && fcrCount > 0) {
                    return ` (${metro2Count}M2, ${fcrCount}FCRA)`;
                  } else if (metro2Count > 0) {
                    return ` (${metro2Count}M2)`;
                  } else if (fcrCount > 0) {
                    return ` (${fcrCount}FCRA)`;
                  }
                  return '';
                })()}
              </span>
              {showViolations ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </button>
            
            {/* Expanded Violations List */}
            {showViolations && (
              <div className="-mt-2 space-y-2 bg-blue-50 border border-blue-600 rounded-lg p-3" style={{ marginTop: '-8px' }}>
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => setShowViolations(!showViolations)}
                    className="flex-1 text-left hover:bg-blue-100 rounded-md p-2 transition-colors mr-2"
                  >
                    <h4 className="text-sm font-medium text-gray-900">Detected Violations</h4>
                  </button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      addAllViolations(e);
                    }}
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs font-black bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-blue-600 hover:border-blue-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Use All {aiViolations.length}
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  {aiViolations.map((violation, index) => (
                  <div key={index} className="p-3 bg-white rounded border border-gray-200">
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            violation.includes('Metro 2') 
                              ? 'border-transparent text-white' 
                              : 'border-transparent bg-red-600 text-white'
                          }`} style={violation.includes('Metro 2') ? { backgroundColor: '#2563eb' } : {}}>
                            {violation.includes('Metro 2') ? 'Metro 2' : 'FCRA'}
                          </span>
                          <span className="text-sm font-medium">{violation}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log("Violation button clicked:", violation);
                          if (selectedViolations.includes(violation)) {
                            console.log("Removing violation");
                            removeViolationFromDispute(violation);
                          } else {
                            console.log("Adding violation");
                            addViolationToDispute(violation);
                          }
                        }}
                        className={selectedViolations.includes(violation) ? 'bg-blue-50 border-blue-300' : ''}
                      >
                        {selectedViolations.includes(violation) ? 'Added' : 'Add to Dispute'}
                      </Button>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                          violation.includes('Metro 2') 
                            ? 'border-transparent text-white' 
                            : 'border-transparent bg-red-600 text-white'
                        }`} style={violation.includes('Metro 2') ? { backgroundColor: '#2563eb' } : {}}>
                          {violation.includes('Metro 2') ? 'M-2' : 'FCRA'}
                        </span>
                        <span className="text-sm font-medium">{violation}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log("Violation button clicked:", violation);
                          if (selectedViolations.includes(violation)) {
                            console.log("Removing violation");
                            removeViolationFromDispute(violation);
                          } else {
                            console.log("Adding violation");
                            addViolationToDispute(violation);
                          }
                        }}
                        className={`w-full border-2 font-black ${selectedViolations.includes(violation) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                      >
                        {selectedViolations.includes(violation) ? 'Added' : 'Add to Dispute'}
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guided Help Section - Optional suggestions */}
        {hasAnyNegative && aiViolations.length > 0 && aiScanCompleted && (
          <div className="mb-4" style={{ marginTop: '-4px' }}>
            <button
              onClick={() => setShowGuidedHelp(!showGuidedHelp)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-2 rounded-md transition-colors font-medium"
            >
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span>View AI Dispute Suggestions</span>
              {showGuidedHelp ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </button>

            {/* Expanded Guided Help - Simplified 3 combinations */}
            {showGuidedHelp && (
              <div className="mt-3 space-y-2 bg-blue-50 border border-blue-600 rounded-lg p-3">
                <button
                  onClick={() => setShowGuidedHelp(!showGuidedHelp)}
                  className="mb-3 w-full flex items-center justify-between text-left hover:bg-blue-100 rounded-md p-2 transition-colors"
                >
                  <h4 className="text-sm font-medium text-gray-900">AI Dispute Suggestions</h4>
                </button>
                
                <div className="space-y-2">
                  {getBestPracticeCombinations().map((combination, index) => (
                    <div key={index} className="p-3 bg-white rounded border border-gray-200">
                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent text-white" style={{ backgroundColor: '#2563eb' }}>
                              AI Suggestion
                            </span>
                            <span className="text-sm font-medium">{combination.title}</span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>Reason:</strong> {combination.reason}</div>
                            <div><strong>Instruction:</strong> {combination.instruction}</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyBestPracticeCombination(combination, index, e);
                          }}
                          className={selectedSuggestionIndex === index ? 'bg-blue-50 border-blue-300' : ''}
                        >
                          {selectedSuggestionIndex === index ? 'Added' : 'Add to Dispute'}
                        </Button>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 border-transparent text-white" style={{ backgroundColor: '#2563eb' }}>
                            AI Suggestion
                          </span>
                          <span className="text-sm font-medium">{combination.title}</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mb-3">
                          <div><strong>Reason:</strong> {combination.reason}</div>
                          <div><strong>Instruction:</strong> {combination.instruction}</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyBestPracticeCombination(combination, index, e);
                          }}
                          className={`w-full border-2 font-black ${selectedSuggestionIndex === index ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                        >
                          {selectedSuggestionIndex === index ? 'Added' : 'Add to Dispute'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500 italic mt-3 pt-2 border-t border-blue-200">
                  {selectedSuggestionIndex !== null ? (
                    <div className="flex items-center justify-between">
                      <span>Suggestion applied to dispute form below.</span>
                      <button
                        onClick={() => {
                          setSelectedSuggestionIndex(null);
                          setCustomReason('');
                          setCustomInstruction('');
                          setShowCustomReasonField(false);
                          setShowCustomInstructionField(false);
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-xs"
                      >
                        Choose different suggestion
                      </button>
                    </div>
                  ) : (
                    "Click any option above to auto-fill both reason and instruction fields, or choose your own options below."
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dispute Section (only for negative accounts) */}
        {hasAnyNegative && (
          <div className="pt-1 mt-1" data-account-id={`${account['@_SubscriberCode']}-dispute`}>
            <div className="flex items-center gap-3 mb-4" data-step="2" id={`dispute-step-${accountUniqueId}`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 md:w-5 md:h-5 text-white text-sm font-black rounded-full flex-shrink-0 transition-colors duration-300 ${
                isDisputeSaved ? 'bg-green-600' : 'bg-blue-600'
              }`}>2</span>
              <span className="font-bold">
                {isDisputeSaved ? 'Dispute details completed' : 'Create Dispute'}
              </span>
            </div>







            <div className="space-y-4">

              {/* Reason Selection */}
              <div>
                <div>
                  {!showCustomReasonField && (
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Dispute Reason</label>
                      {isTypingReason && (
                        <div className="flex items-center text-blue-600 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                          AI Writing...
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    {!isTypingReason && !showCustomReasonField ? (
                      <select
                        value={selectedReason || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Reset dispute saved state when dropdown is changed
                          if (isDisputeSaved) {
                            setIsDisputeSaved(false);
                          }
                          if (value === "") {
                            setShowCustomReasonField(true);
                            setSelectedReason("");
                            setCustomReason("");
                          } else {
                            setCustomReason(value);
                            setSelectedReason(value);
                            setShowCustomReasonField(false);
                            setTimeout(() => checkFormCompletionAndShowArrow(value), 300);
                          }
                        }}
                        className="w-full border border-gray-300 bg-white h-[40px] px-3 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select dispute reason...</option>
                        {disputeReasons.slice(1, -1).map((reason) => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                        <option value="">✏️ Write custom reason...</option>
                      </select>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2 min-h-[20px]">
                          <label className="text-sm font-medium">Dispute Reason</label>
                          <button
                            onClick={() => {
                              setCustomReason("");
                              setSelectedReason("");
                              setSelectedViolations([]);
                              setHasAiGeneratedText(false);
                              setShowCustomReasonField(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Reset & choose different reason
                          </button>
                        </div>
                        <textarea
                          value={customReason || ""}
                          onChange={(e) => {
                            if (!isTypingReason) {
                              setCustomReason(e.target.value);
                              // Reset dispute saved state when text is modified
                              if (isDisputeSaved) {
                                setIsDisputeSaved(false);
                              }
                            }
                          }}
                          placeholder={isTypingReason ? "AI is writing your dispute reason..." : "Enter your dispute reason..."}
                          className="w-full border border-gray-300 bg-white rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          readOnly={isTypingReason}
                          rows={Math.max(1, Math.ceil((customReason || "").length / 80))}
                          style={{ 
                            minHeight: '40px',
                            height: 'auto'
                          }}
                        />
                        {customReason.trim() && !isTypingReason && !hasAiGeneratedText && !customReason.includes('Metro 2') && !customReason.includes('FCRA') && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => {
                                saveTemplateMutation.mutate({
                                  type: 'reason',
                                  text: customReason.trim(),
                                  category: 'accounts'
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
                <div>
                  {!showCustomInstructionField && (
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Dispute Instruction</label>
                      {isTypingInstruction && (
                        <div className="flex items-center text-blue-600 text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                          AI Writing...
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    {!isTypingInstruction && !showCustomInstructionField ? (
                      <select
                        value={selectedInstruction || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Reset dispute saved state when dropdown is changed
                          if (isDisputeSaved) {
                            setIsDisputeSaved(false);
                          }
                          if (value === "") {
                            setShowCustomInstructionField(true);
                            setSelectedInstruction("");
                            setCustomInstruction("");
                          } else {
                            setCustomInstruction(value);
                            setSelectedInstruction(value);
                            setShowCustomInstructionField(false);
                            setTimeout(() => checkFormCompletionAndShowArrow(undefined, value), 300);
                          }
                        }}
                        className="w-full border border-gray-300 bg-white h-[40px] px-3 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select dispute instruction...</option>
                        {disputeInstructions.slice(1, -1).map((instruction) => (
                          <option key={instruction} value={instruction}>{instruction}</option>
                        ))}
                        <option value="">✏️ Write custom instruction...</option>
                      </select>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2 min-h-[20px]">
                          <label className="text-sm font-medium">Dispute Instruction</label>
                          <button
                            onClick={() => {
                              setCustomInstruction("");
                              setSelectedInstruction("");
                              setShowCustomInstructionField(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Reset & choose different instruction
                          </button>
                        </div>
                        <textarea
                          value={customInstruction || ""}
                          onChange={(e) => {
                            if (!isTypingInstruction) {
                              setCustomInstruction(e.target.value);
                              // Reset dispute saved state when text is modified
                              if (isDisputeSaved) {
                                setIsDisputeSaved(false);
                              }
                            }
                          }}
                          placeholder={isTypingInstruction ? "AI is writing your dispute instruction..." : "Enter your dispute instruction..."}
                          className="w-full border border-gray-300 bg-white rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          readOnly={isTypingInstruction}
                          rows={2}
                          style={{ 
                            minHeight: '60px'
                          }}
                        />
                        {customInstruction.trim() && !isTypingInstruction && !hasAiGeneratedText && !customInstruction.includes('Metro 2') && !customInstruction.includes('FCRA') && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => {
                                saveTemplateMutation.mutate({
                                  type: 'instruction',
                                  text: customInstruction.trim(),
                                  category: 'accounts'
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



              {/* Submit Button */}
              <div className="flex gap-2 justify-between items-center pt-2">
                {(!(selectedReason || customReason.trim())) || (!(selectedInstruction || customInstruction.trim())) ? (
                  <div className="flex items-center bg-red-50 border border-red-300 rounded-md px-3 py-1 md:gap-2 md:justify-start justify-center">
                    <AlertTriangle className="hidden md:block w-4 h-4 text-red-600" />
                    <span className="text-xs md:text-sm text-red-600">
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
                  <span className="inline-flex items-center justify-center w-6 h-6 md:w-5 md:h-5 bg-blue-600 text-white text-sm font-black rounded-full mr-1 flex-shrink-0">3</span>
                  <Button 
                    onClick={() => {
                      // Check if required fields are filled
                    const hasReason = (selectedViolations.length > 0 || showCustomReasonField) ? customReason.trim() : selectedReason;
                    const hasInstruction = (selectedViolations.length > 0 || showCustomInstructionField) ? customInstruction.trim() : selectedInstruction;
                    
                    if (!hasReason || !hasInstruction) {
                      toast({
                        title: "Missing Information",
                        description: "Please fill in both the reason and instruction fields before continuing.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Save the dispute data
                    console.log("Saving dispute:", { 
                      reason: (selectedViolations.length > 0 || showCustomReasonField) ? customReason : selectedReason, 
                      instruction: (selectedViolations.length > 0 || showCustomInstructionField) ? customInstruction : selectedInstruction, 
                      violations: selectedViolations 
                    });
                    
                    // Set dispute as saved
                    setIsDisputeSaved(true);
                    
                    // Notify parent component that this account's dispute was saved
                    if (onDisputeSaved) {
                      const accountId = account["@CreditLiabilityID"] || account["@_AccountNumber"] || account["@_SubscriberCode"] || "unknown";
                      console.log("Dispute saved for account ID:", accountId);
                      onDisputeSaved(accountId);
                    }
                    
                    // Find next negative account and scroll to it
                    setTimeout(() => {
                      const currentCard = document.querySelector(`[data-account-id="${account["@CreditLiabilityID"] || account["@_AccountNumber"] || "current"}"]`);
                      if (currentCard) {
                        // Find all account cards
                        const allCards = document.querySelectorAll('[data-account-id]');
                        const currentIndex = Array.from(allCards).indexOf(currentCard);
                        
                        // Look for next negative account (with red background)
                        for (let i = currentIndex + 1; i < allCards.length; i++) {
                          const card = allCards[i] as HTMLElement;
                          if (card.querySelector('.bg-red-50')) {
                            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            return;
                          }
                        }
                        
                        // If no more negative accounts, show completion message
                        toast({
                          title: "All Complete!",
                          description: "All negative accounts have been processed!",
                          className: "bg-blue-50 border-blue-200 text-blue-800",
                        });
                      }
                    }, 500);
                  }}
                  disabled={
                    selectedViolations.length > 0 
                      ? !customReason.trim() || !customInstruction.trim()
                      : (showCustomReasonField ? !customReason.trim() : !selectedReason) || 
                        (showCustomInstructionField ? !customInstruction.trim() : !selectedInstruction)
                  }
                  className={`!w-full !max-w-full !h-10 !px-4 !py-2 text-white rounded-md font-medium transition-colors duration-200 !opacity-100 !inline-flex !items-center !justify-center !box-border ${
                    isDisputeSaved 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  } disabled:!bg-gray-400 disabled:cursor-not-allowed disabled:!opacity-100 disabled:!w-full disabled:!max-w-full`}
                >
                  {isDisputeSaved ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Dispute Saved</span>
                      <span className="md:hidden">Saved</span>
                    </>
                  ) : (
                    "Save Dispute and Continue"
                  )}
                </Button>
                </div>
              </div>



            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}