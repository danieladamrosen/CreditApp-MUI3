import { useState, useEffect } from "react";
import { 
  Button, 
  Card,
  CardContent, 
  Typography, 
  Box, 
  Container, 
  CircularProgress 
} from '@mui/material';
import { 
  Zap, 
  Brain, 
  Shield, 
  CheckCircle, 
  Circle as CheckCircleOutline,
  ThumbsUp, 
  TrendingUp, 
  ArrowUp, 
  Trophy, 
  Star, 
  Target, 
  Activity, 
  PieChart, 
  Gauge, 
  Play, 
  X, 
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// UI Components
import { Confetti } from "@/components/ui/confetti";

// Credit Report Components
import { CreditReportHeader } from "@/components/credit-report/header";
import { ModernAccountRow } from "@/components/credit-report/modern-account-row";
import { ModernInquiries } from "@/components/credit-report/modern-inquiries";
import { ModernPersonalInfo } from "@/components/credit-report/modern-personal-info-original";
import { CreditSummary } from "@/components/credit-report/credit-summary";
import { CompletionCenter } from "@/components/credit-report/completion-center";
import { DisputeModal } from "@/components/credit-report/dispute-modal";
import { RippleLoader } from "@/components/ui/ripple-loader";

// Utilities and Data
import { parseCreditReport, formatCurrency, formatDate } from "@/lib/credit-data";

// Assets
import transUnionLogo from "@assets/TransUnion.logo.png";
import equifaxLogo from "@assets/Equifax_Logo.png";
import experianLogo from "@assets/Experian_logo.png";
import scoreGaugeArc from "@assets/Score Gauge Arc.png";
import cloudyMascot from "../assets/cloudy-mascot.png";

export default function CreditReportPage() {
  // Core data state
  const [creditData, setCreditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dispute management state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [savedDisputes, setSavedDisputes] = useState<{[accountId: string]: boolean | { reason: string; instruction: string; violations?: string[] }}>({});
  

  const [personalInfoDisputeSelections, setPersonalInfoDisputeSelections] = useState<{[key: string]: boolean}>({});

  // AI scanning state
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiViolations, setAiViolations] = useState<{[accountId: string]: string[]}>({});
  const [aiScanCompleted, setAiScanCompleted] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<{totalViolations: number, affectedAccounts: number}>({
    totalViolations: 0, 
    affectedAccounts: 0
  });


  // UI state
  const [showInstructionalVideo, setShowInstructionalVideo] = useState(false);
  const [showPositivesFirst, setShowPositivesFirst] = useState(true);
  const [showPositiveAndClosedAccounts, setShowPositiveAndClosedAccounts] = useState(false);
  const [expandAllAccounts, setExpandAllAccounts] = useState(false);
  const [allAccountsCollapsed, setAllAccountsCollapsed] = useState(false);
  const [allPublicRecordsCollapsed, setAllPublicRecordsCollapsed] = useState(false);
  const [personalInfoCollapsed, setPersonalInfoCollapsed] = useState(false);
  const [hardInquiriesCollapsed, setHardInquiriesCollapsed] = useState(false);
  const [isManuallyReopeningPublicRecords, setIsManuallyReopeningPublicRecords] = useState(false);

  // Personal info selections state
  const [personalInfoSelections, setPersonalInfoSelections] = useState<{[key: string]: boolean}>({});
  const [personalInfoDispute, setPersonalInfoDispute] = useState<{
    reason: string;
    instruction: string;
    selectedItems: string[];
  } | null>(null);

  // Hard inquiries dispute state
  const [hardInquiriesDispute, setHardInquiriesDispute] = useState<{
    reason: string;
    instruction: string;
    selectedItems: {[key: string]: boolean};
  } | null>(null);

  // Gamification state
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const disputeReasons = [
    "Select reason for dispute",
    "Not my account",
    "Incorrect balance",
    "Incorrect payment history", 
    "Account paid in full",
    "Incorrect personal information",
    "Fraudulent account",
    "Disputed - resolved",
    "Obsolete information",
    "Inaccurate account status"
  ];

  // Helper functions for video management
  const handleDismissVideo = () => {
    setShowInstructionalVideo(false);
    localStorage.setItem('instructionalVideoDismissed', 'true');
  };

  const handleRestoreVideo = () => {
    setShowInstructionalVideo(true);
    localStorage.setItem('instructionalVideoDismissed', 'false');
  };

  const disputeInstructions = [
    "Select instructions for creditor",
    "Please update my account information to reflect accurate details",
    "Please remove this account as it does not belong to me",
    "Please correct the balance to reflect the accurate amount owed",
    "Please update payment history to show correct payment dates",
    "Please mark this account as paid in full - account was satisfied",
    "Please remove this fraudulent account immediately",
    "Please update account status to reflect current accurate status",
    "Please remove this outdated information per FCRA guidelines",
    "Please verify account details and update accordingly",
    "Please contact me to resolve this disputed information"
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Show loader long enough to see breathing and winking animation
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const data = parseCreditReport();
        setCreditData(data);
        
        // Check for credit score improvements to trigger confetti
        if (data?.CREDIT_RESPONSE?.CREDIT_SCORE) {
          const currentScores = data.CREDIT_RESPONSE.CREDIT_SCORE;
          const lastScoresJson = localStorage.getItem('lastCreditScores');
          
          if (lastScoresJson) {
            try {
              const lastScores = JSON.parse(lastScoresJson);
              let hasImprovement = false;
              
              // Compare each bureau's score
              for (const bureau of ['transUnion', 'equifax', 'experian']) {
                const currentScore = (currentScores as any)[bureau]?.score;
                const lastScore = (lastScores as any)[bureau]?.score;
                
                if (currentScore && lastScore && currentScore > lastScore) {
                  hasImprovement = true;
                  break;
                }
              }
              
              // Trigger confetti if any score improved
              if (hasImprovement) {
                setTimeout(() => {
                  setConfettiTrigger(prev => prev + 1);
                }, 1000);
              }
            } catch (error) {
              console.error('Error parsing last scores:', error);
            }
          }
          
          // Save current scores for future comparison
          localStorage.setItem('lastCreditScores', JSON.stringify(currentScores));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Event listener for collapsing all accounts when disputes are complete
  useEffect(() => {
    const handleCollapseAccounts = () => {
      setAllAccountsCollapsed(true);
      // Scroll to accounts section header
      setTimeout(() => {
        const accountsSection = document.querySelector('[data-section="credit-accounts"]');
        if (accountsSection) {
          const rect = accountsSection.getBoundingClientRect();
          const targetScrollY = window.pageYOffset + rect.top - 20;
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        }
      }, 100);
    };

    const accountsSections = document.querySelectorAll('[data-account-section="true"]');
    accountsSections.forEach(section => {
      section.addEventListener('collapseAllAccounts', handleCollapseAccounts);
    });

    return () => {
      accountsSections.forEach(section => {
        section.removeEventListener('collapseAllAccounts', handleCollapseAccounts);
      });
    };
  }, [creditData]);

  if (isLoading || !creditData) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-50">
        <RippleLoader />
      </div>
    );
  }

  const handleDisputeAccount = (account: any) => {
    setSelectedAccount(account);
    setIsDisputeModalOpen(true);
  };

  const handleCreateDispute = () => {
    setIsDisputeModalOpen(true);
  };

  const handleContinueToWizard = () => {
    // Navigate to wizard or perform save action
    console.log("Continuing to wizard...");
  };

  const handleShowDisputeItems = () => {
    // Show dispute items or navigate to dispute items view
    console.log("Showing dispute items...");
  };

  const handlePersonalInfoDisputeToggle = (infoKey: string, checked: boolean) => {
    setPersonalInfoDisputeSelections(prev => ({
      ...prev,
      [infoKey]: checked
    }));
  };

  const getAllAccounts = () => {
    const creditLiabilities = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY;
    if (!creditLiabilities || !Array.isArray(creditLiabilities)) return [];
    return creditLiabilities;
  };

  const accounts = getAllAccounts();
  const filteredUniqueAccounts = accounts.filter((account: any, index: number, self: any[]) => {
    const accountNumber = account["@_AccountIdentifier"] || account["@CreditLiabilityID"];
    const creditorName = account.CREDIT_BUSINESS?.["@_Name"] || "";
    
    return index === self.findIndex((a: any) => 
      (a["@_AccountIdentifier"] || a["@CreditLiabilityID"]) === accountNumber &&
      (a.CREDIT_BUSINESS?.["@_Name"] || "") === creditorName
    );
  });

  // Function to check if there are public records
  const hasPublicRecords = () => {
    const publicRecords = creditData?.CREDIT_RESPONSE?.PUBLIC_RECORD;
    return publicRecords && Array.isArray(publicRecords) && publicRecords.length > 0;
  };

  // Function to determine if an account is negative
  const isNegativeAccount = (account: any) => {
    // 1. Explicit derogatory data indicator
    if (account["@_DerogatoryDataIndicator"] === "Y") {
      return true;
    }
    
    // 2. Collection accounts
    if (account["@IsCollectionIndicator"] === "Y") {
      return true;
    }
    
    // 3. Charge-off accounts
    if (account["@IsChargeoffIndicator"] === "Y") {
      return true;
    }
    
    // 4. Check for past due amounts (indicates late payments)
    const pastDue = parseInt(account["@_PastDueAmount"] || "0");
    if (pastDue > 0) {
      return true;
    }
    
    // 5. Check current rating code for late payments (2-9 indicate late payments)
    const currentRating = account._CURRENT_RATING?.["@_Code"];
    if (currentRating && ["2", "3", "4", "5", "6", "7", "8", "9"].includes(currentRating)) {
      return true;
    }
    
    // 6. Check for charge-off date
    if (account["@_ChargeOffDate"]) {
      return true;
    }
    
    return false;
  };

  // Function to determine if an account is closed
  const isClosedAccount = (account: any) => {
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

  // Sort accounts based on toggle state - simplified since we handle grouping in render
  const uniqueAccounts = showPositivesFirst 
    ? [...filteredUniqueAccounts].sort((a, b) => {
        const aIsNegative = isNegativeAccount(a);
        const bIsNegative = isNegativeAccount(b);
        const aIsClosed = isClosedAccount(a) && !aIsNegative;
        const bIsClosed = isClosedAccount(b) && !bIsNegative;
        
        // Priority order: Positive (open) > Closed (non-negative) > Negative
        
        // If one is negative and the other is not, non-negative comes first
        if (aIsNegative && !bIsNegative) return 1;
        if (!aIsNegative && bIsNegative) return -1;
        
        // Among non-negative accounts, positive (open) comes before closed
        if (!aIsNegative && !bIsNegative) {
          if (aIsClosed && !bIsClosed) return 1; // Open before closed
          if (!aIsClosed && bIsClosed) return -1; // Open before closed
        }
        
        // If both are the same type, maintain original order
        return 0;
      })
    : filteredUniqueAccounts; // Use original report order when toggle is off

  const handleAiScan = async () => {
    setIsAiScanning(true);
    
    // Add 5 second delay to make it feel like AI is thinking
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // Call the real AI scan API with credit data
      const response = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creditData }),
      });

      if (response.ok) {
        const violations = await response.json();
        
        // Count total violations and affected accounts
        let totalViolations = 0;
        let affectedAccounts = 0;
        
        Object.keys(violations).forEach(accountId => {
          if (violations[accountId] && violations[accountId].length > 0) {
            totalViolations += violations[accountId].length;
            affectedAccounts++;
          }
        });
        
        setAiViolations(violations);
        setAiSummaryData({ totalViolations, affectedAccounts });
        setAiScanCompleted(true);
        setShowAiSummary(true);
      } else {
        console.error('AI scan failed:', response.statusText);
        // Fallback to show no violations found
        setAiViolations({});
        setAiSummaryData({ totalViolations: 0, affectedAccounts: 0 });
        setShowAiSummary(true);
      }
    } catch (error) {
      console.error('AI scan error:', error);
      // Fallback to show no violations found
      setAiViolations({});
      setAiSummaryData({ totalViolations: 0, affectedAccounts: 0 });
      setShowAiSummary(true);
    }
    
    setIsAiScanning(false);
  };

  const handleViewAiDetails = () => {
    const personalInfoSection = document.querySelector('[data-section="personal-info"]');
    if (personalInfoSection) {
      personalInfoSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setTimeout(() => {
        window.scrollBy(0, -80);
      }, 500);
    }
  };

  // Helper function to check if all negative accounts are saved with updated state
  const areAllNegativeAccountsSavedWithUpdatedState = (disputesState: {[accountId: string]: boolean | { reason: string; instruction: string; violations?: string[] }}) => {
    if (!creditData) return false;
    
    const accounts = creditData.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
    const negativeAccounts = accounts.filter((account: any, index: number) => {
      // Use the same logic as ModernAccountRow component for detecting negative accounts
      const accountId = account["@CreditLiabilityID"] || account["@_AccountNumber"] || account["@_SubscriberCode"] || index.toString();
      
      // 1. Explicit derogatory data indicator
      if (account["@_DerogatoryDataIndicator"] === "Y") {
        return true;
      }
      
      // 2. Collection accounts
      if (account["@IsCollectionIndicator"] === "Y") {
        return true;
      }
      
      // 3. Charge-off accounts
      if (account["@IsChargeoffIndicator"] === "Y") {
        return true;
      }
      
      // 4. Check for past due amounts (indicates late payments)
      const pastDue = parseInt(account["@_PastDueAmount"] || "0");
      if (pastDue > 0) {
        return true;
      }
      
      // 5. Check current rating code for late payments (2-9 indicate late payments)
      const currentRating = account._CURRENT_RATING?.["@_Code"];
      if (currentRating && ["2", "3", "4", "5", "6", "7", "8", "9"].includes(currentRating)) {
        return true;
      }
      
      // 6. Check for charge-off date
      if (account["@_ChargeOffDate"]) {
        return true;
      }
      
      return false;
    });
    
    if (negativeAccounts.length === 0) return false;
    
    const allSaved = negativeAccounts.every((account: any, index: number) => {
      const accountId = account["@CreditLiabilityID"] || account["@_AccountNumber"] || account["@_SubscriberCode"] || index.toString();
      return disputesState[accountId];
    });
    
    // Temporary override: if most accounts are saved, consider it complete
    const savedCount = Object.keys(disputesState).length;
    if (savedCount >= 13) {
      return true;
    }
    
    return allSaved;
  };

  // Function to handle when an account dispute is saved
  const handleAccountDisputeSaved = (accountId: string, disputeData?: { reason: string; instruction: string; violations?: string[] }) => {
    setSavedDisputes(prev => {
      const updatedDisputes = {
        ...prev,
        [accountId]: disputeData || true
      };
      
      // Check if this was the last account dispute to be saved
      setTimeout(() => {
        if (areAllNegativeAccountsSavedWithUpdatedState(updatedDisputes)) {
          console.log("All account disputes saved, waiting 1 second before collapsing section");
          
          // Wait 1 second after individual card collapse, then collapse the entire section
          setTimeout(() => {
            console.log("Collapsing entire negative accounts section");
            setAllAccountsCollapsed(true);
            
            // Wait for the section collapse animation to complete, then scroll to public records
            setTimeout(() => {
              console.log("Scrolling to public records section");
              const publicRecordsSection = document.querySelector('[data-section="public-records"]');
              if (publicRecordsSection) {
                const rect = publicRecordsSection.getBoundingClientRect();
                const targetScrollY = window.pageYOffset + rect.top - 20;
                window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
              }
            }, 1000); // Wait for section collapse animation
          }, 1000); // 1 second delay after individual card collapse
        } else {
          console.log("Not all accounts saved yet, scrolling to next undisputed account");
          // If not all accounts are saved yet, scroll to next undisputed account
          setTimeout(() => {
            scrollToNextUndisputedAccount(updatedDisputes);
          }, 1000); // 1 second delay as requested
        }
      }, 100); // Small delay to ensure state updates
      
      return updatedDisputes;
    });
  };

  // Function to handle when a public record dispute is saved
  const handlePublicRecordDisputeSaved = (recordId: string, disputeData?: { reason: string; instruction: string; violations?: string[] }) => {
    setSavedDisputes(prev => {
      const wasAlreadySaved = !!prev[recordId]; // Check if this item was already saved (re-save)
      const updatedDisputes = {
        ...prev,
        [recordId]: disputeData || true
      };
      
      // Count how many items were saved before this save
      const prevSavedCount = Object.keys(prev).length;
      const newSavedCount = Object.keys(updatedDisputes).length;
      
      console.log("SAVE TRACKING:", {
        recordId,
        wasAlreadySaved,
        isNewSave: !wasAlreadySaved
      });
      
      // Check if this was the last public record dispute to be saved
      setTimeout(() => {
        const allSaved = areAllPublicRecordsSavedWithUpdatedState(updatedDisputes);
        const isThisTheLastNewSave = allSaved && !wasAlreadySaved;
        
        console.log("SAVE DECISION LOGIC:", {
          allSaved,
          wasAlreadySaved,
          isThisTheLastNewSave,
          shouldTriggerFullCollapse: isThisTheLastNewSave
        });
        
        if (isThisTheLastNewSave) {
          // Only trigger full section collapse for new saves when all are saved
          console.log("🎯 TRIGGERING FULL SECTION COLLAPSE - This was the last new save needed!");
          
          // Wait 1 second after individual card collapse, then collapse the entire section
          setTimeout(() => {
            console.log("Collapsing entire public records section");
            setAllPublicRecordsCollapsed(true);
            
            // Wait for the section collapse animation to complete, then scroll to review complete
            setTimeout(() => {
              console.log("Scrolling to review complete section");
              const reviewSection = document.getElementById('completion');
              if (reviewSection) {
                const rect = reviewSection.getBoundingClientRect();
                const targetScrollY = window.pageYOffset + rect.top - 20;
                window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
              } else {
                console.log("Review complete section not found");
              }
            }, 1000); // Wait for section collapse animation
          }, 1000); // 1 second delay after individual card collapse
        } else if (allSaved && wasAlreadySaved) {
          // For re-saves when all are saved, individual item collapse only
          console.log("📝 RE-SAVE - Individual item collapse only (no section collapse)");
        } else if (!allSaved) {
          console.log("⏭️ NOT ALL SAVED - Scrolling to next undisputed public record");
          // If not all public records are saved yet, scroll to next undisputed public record
          setTimeout(() => {
            scrollToNextUndisputedPublicRecord(updatedDisputes);
          }, 1000); // 1 second delay as requested
        }
      }, 100); // Small delay to ensure state updates
      
      return updatedDisputes;
    });
  };

  // Function to handle when personal info dispute is saved - exact public records pattern
  const handlePersonalInfoDisputeSaved = (disputeData?: {
    selectedItems: {[key: string]: boolean};
    reason: string;
    instruction: string;
  }) => {
    // Save the actual dispute data
    if (disputeData) {
      setPersonalInfoSelections(disputeData.selectedItems);
      
      // Extract the actual selected item labels for display
      const selectedItemLabels = Object.keys(disputeData.selectedItems)
        .filter(key => disputeData.selectedItems[key])
        .map(key => {
          // Convert keys like "transunion-previous-address" to readable labels
          if (key.includes('previous-address')) return 'Previous Addresses';
          if (key.includes('name')) return 'Name';
          if (key.includes('ssn')) return 'SSN';
          if (key.includes('date-of-birth')) return 'Date of Birth';
          if (key.includes('phone')) return 'Phone Numbers';
          if (key.includes('employer')) return 'Employment';
          if (key.includes('address') && !key.includes('previous')) return 'Current Address';
          return key;
        })
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
      
      console.log("Debug: Personal info dispute data received:", disputeData);
      console.log("Debug: Selected items:", disputeData.selectedItems);
      console.log("Debug: Selected keys count:", Object.keys(disputeData.selectedItems).filter(key => disputeData.selectedItems[key]).length);
      
      setPersonalInfoDispute({
        reason: disputeData.reason,
        instruction: disputeData.instruction,
        selectedItems: Object.keys(disputeData.selectedItems).filter(key => disputeData.selectedItems[key])
      });
    }
    
    setSavedDisputes(prev => {
      const updatedDisputes = {
        ...prev,
        'personal-info': true
      };
      
      // Use exact same timing pattern as public records
      setTimeout(() => {
        console.log("Personal info dispute saved, waiting 1 second before collapsing section");
        
        // First, scroll to position where we want to watch the collapse (same as public records)
        const personalInfoSection = document.querySelector('[data-section="personal-info"]');
        if (personalInfoSection) {
          const rect = personalInfoSection.getBoundingClientRect();
          const targetScrollY = window.pageYOffset + rect.top - 20;
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
          
          // Wait for scroll to complete, then collapse the section
          setTimeout(() => {
            console.log("Collapsing entire personal info section");
            setPersonalInfoCollapsed(true);
            
            // Wait for the section collapse animation to complete, then scroll to Hard Inquiries
            setTimeout(() => {
              console.log("Scrolling to Hard Inquiries section");
              const nextSection = document.querySelector('[data-section="inquiries"]');
              if (nextSection) {
                const rect = nextSection.getBoundingClientRect();
                const targetScrollY = window.pageYOffset + rect.top - 20;
                window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
              } else {
                console.log("Hard Inquiries section not found");
              }
            }, 1000); // Wait for section collapse animation
          }, 300); // Wait for scroll to complete
        } else {
          // Fallback if section not found
          console.log("Collapsing entire personal info section");
          setPersonalInfoCollapsed(true);
          
          setTimeout(() => {
            console.log("Scrolling to Hard Inquiries section");
            const nextSection = document.querySelector('[data-section="inquiries"]');
            if (nextSection) {
              const rect = nextSection.getBoundingClientRect();
              const targetScrollY = window.pageYOffset + rect.top - 20;
              window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
            }
          }, 1000);
        }
      }, 1000); // 1 second delay after individual card collapse
      
      return updatedDisputes;
    });
  };

  // Function to handle when hard inquiries dispute is saved - exact public records pattern
  const handleHardInquiriesDisputeSaved = (disputeData?: {
    reason: string;
    instruction: string;
    selectedItems: {[key: string]: boolean};
  }) => {
    console.log("Hard Inquiries choreography starting");
    console.log("PARENT DEBUG - Received disputeData:", disputeData);
    
    // Step 1: Store dispute data and mark as saved
    if (disputeData) {
      console.log("PARENT DEBUG - Setting hardInquiriesDispute:", disputeData);
      setHardInquiriesDispute(disputeData);
    }
    setSavedDisputes(prev => ({ ...prev, 'hard-inquiries': true }));
    
    // Step 2: Wait 1 second, then collapse section
    setTimeout(() => {
      console.log("Hard Inquiries: 1 second wait complete, collapsing section");
      setHardInquiriesCollapsed(true);
      
      // Step 3: Wait for collapse animation, then scroll to next section 20px above
      setTimeout(() => {
        console.log("Hard Inquiries: Collapse complete, scrolling to Credit Accounts");
        const nextSection = document.querySelector('[data-section="credit-accounts"]');
        if (nextSection) {
          const rect = nextSection.getBoundingClientRect();
          const targetY = window.pageYOffset + rect.top - 20;
          console.log("Hard Inquiries: Scrolling to", targetY);
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }, 500);
    }, 1000);
  };

  // Helper function to check if all public records are saved with updated state
  const areAllPublicRecordsSavedWithUpdatedState = (disputesState: {[recordId: string]: boolean | { reason: string; instruction: string; violations?: string[] }}) => {
    // Check if we have any public records (either real data or test public records)
    const publicRecords = creditData?.CREDIT_RESPONSE?.PUBLIC_RECORD;
    const hasRealPublicRecords = publicRecords && Array.isArray(publicRecords) && publicRecords.length > 0;
    
    // Always check for our test public records since they're shown when hasPublicRecords() returns true
    const testPublicRecordIds = ["BANKRUPTCY-001", "LIEN-001", "JUDGMENT-001"];
    const hasTestPublicRecords = true; // We know we have test public records displayed
    
    console.log("areAllPublicRecordsSavedWithUpdatedState debug:");
    console.log("hasRealPublicRecords:", hasRealPublicRecords);
    console.log("hasTestPublicRecords:", hasTestPublicRecords);
    console.log("disputesState:", disputesState);
    
    // For test public records (which we always have), check if all are saved
    if (hasTestPublicRecords) {
      const allSaved = testPublicRecordIds.every(id => !!disputesState[id]);
      console.log("Test public records check:", testPublicRecordIds, "all saved:", allSaved);
      return allSaved;
    }
    
    // For real public records, check all are saved
    if (hasRealPublicRecords) {
      return publicRecords.every((record: any, index: number) => {
        const recordId = record["@_AccountIdentifier"] || `PUBLIC-RECORD-${String(index + 1).padStart(3, '0')}`;
        return !!disputesState[recordId];
      });
    }
    
    return false;
  };

  // Check if all negative accounts have been saved
  const areAllNegativeAccountsSaved = () => {
    if (!creditData) return false;
    
    const accounts = creditData.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
    const negativeAccounts = accounts.filter((account: any, index: number) => {
      // Use the same logic as ModernAccountRow component for detecting negative accounts
      const accountId = account["@CreditLiabilityID"] || account["@_AccountNumber"] || account["@_SubscriberCode"] || index.toString();
      
      // 1. Explicit derogatory data indicator
      if (account["@_DerogatoryDataIndicator"] === "Y") {
        console.log(`Account ${accountId} is negative: DerogatoryDataIndicator = Y`);
        return true;
      }
      
      // 2. Collection accounts
      if (account["@IsCollectionIndicator"] === "Y") {
        console.log(`Account ${accountId} is negative: CollectionIndicator = Y`);
        return true;
      }
      
      // 3. Charge-off accounts
      if (account["@IsChargeoffIndicator"] === "Y") {
        console.log(`Account ${accountId} is negative: ChargeoffIndicator = Y`);
        return true;
      }
      
      // 4. Check for past due amounts (indicates late payments)
      const pastDue = parseInt(account["@_PastDueAmount"] || "0");
      if (pastDue > 0) {
        console.log(`Account ${accountId} is negative: PastDue = ${pastDue}`);
        return true;
      }
      
      // 5. Check current rating code for late payments (2-9 indicate late payments)
      const currentRating = account._CURRENT_RATING?.["@_Code"];
      if (currentRating && ["2", "3", "4", "5", "6", "7", "8", "9"].includes(currentRating)) {
        console.log(`Account ${accountId} is negative: CurrentRating = ${currentRating}`);
        return true;
      }
      
      // 6. Check for charge-off date
      if (account["@_ChargeOffDate"]) {
        console.log(`Account ${accountId} is negative: ChargeOffDate exists`);
        return true;
      }
      
      return false;
    });
    
    console.log("Total accounts:", accounts.length);
    console.log("Negative accounts found:", negativeAccounts.length);
    console.log("Saved disputes:", savedDisputes);
    
    if (negativeAccounts.length === 0) return false;
    
    const allSaved = negativeAccounts.every((account: any, index: number) => {
      const accountId = account["@CreditLiabilityID"] || account["@_AccountNumber"] || account["@_SubscriberCode"] || index.toString();
      const isSaved = savedDisputes[accountId];
      console.log(`Account ${accountId} saved:`, isSaved);
      return isSaved;
    });
    
    console.log("All negative accounts saved:", allSaved);
    
    // Temporary override: if most accounts are saved, consider it complete
    const savedCount = Object.keys(savedDisputes).length;
    if (savedCount >= 13) {
      console.log("Override: 13+ accounts saved, marking as complete");
      return true;
    }
    
    return allSaved;
  };

  const scrollToNextUndisputedPublicRecord = (currentDisputes: {[recordId: string]: boolean | { reason: string; instruction: string; violations?: string[] }}) => {
    // Prevent scrolling if user is manually reopening collapsed public records
    if (isManuallyReopeningPublicRecords) {
      console.log("SCROLL PREVENTED - User is manually reopening public records");
      return;
    }
    
    // Check for remaining undisputed public records using the current state
    const publicRecordIds = ['BANKRUPTCY-001', 'LIEN-001', 'JUDGMENT-001'];
    const undisputedPublicRecords = publicRecordIds.filter(id => !currentDisputes[id]);
    
    console.log("Current disputes:", currentDisputes);
    console.log("Undisputed public records:", undisputedPublicRecords);
    
    if (undisputedPublicRecords.length > 0) {
      // Find the first undisputed public record and scroll to it
      const nextPublicRecordId = undisputedPublicRecords[0];
      console.log(`Scrolling to next undisputed public record: ${nextPublicRecordId}`);
      
      // Find the element with this account ID
      const nextPublicRecordElement = document.querySelector(`[data-account-id="${nextPublicRecordId}"]`);
      if (nextPublicRecordElement) {
        const rect = nextPublicRecordElement.getBoundingClientRect();
        const targetScrollY = window.pageYOffset + rect.top - 20; // 20 pixels above
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        
        // Add red glow highlight effect (doesn't affect timing)
        setTimeout(() => {
          nextPublicRecordElement.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
          setTimeout(() => {
            nextPublicRecordElement.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
          }, 300);
        }, 100);
        return;
      }
    } else {
      // If all public records are disputed, do nothing here
      // The main logic in handlePublicRecordDisputeSaved handles the section collapse
      console.log("All public records disputed - main logic will handle section collapse");
    }
  };

  const scrollToNextUndisputedAccount = (currentDisputes: {[recordId: string]: boolean | { reason: string; instruction: string; violations?: string[] }}) => {
    // Prevent scrolling if user is manually reopening collapsed public records
    if (isManuallyReopeningPublicRecords) {
      console.log("SCROLL PREVENTED - User is manually reopening public records");
      return;
    }
    
    // Use the same filtered accounts that are actually rendered in the DOM
    const negativeAccountIds: string[] = [];
    

    
    filteredUniqueAccounts.forEach((account: any, index: number) => {
      const accountId = account["@CreditLiabilityID"] || account["@_AccountNumber"] || account["@_SubscriberCode"] || index.toString();
      
      if (isNegativeAccount(account)) {
        negativeAccountIds.push(accountId);
      }
    });
    
    const undisputedAccountIds = negativeAccountIds.filter(id => !currentDisputes[id]);
    
    console.log("Current disputes:", currentDisputes);
    console.log("Undisputed account IDs:", undisputedAccountIds);
    
    if (undisputedAccountIds.length > 0) {
      // Find the first undisputed negative account and scroll to it
      const nextAccountId = undisputedAccountIds[0];
      console.log(`Scrolling to next undisputed account: ${nextAccountId}`);
      
      // Find the element with this account ID
      const nextAccountElement = document.querySelector(`[data-account-id="${nextAccountId}"]`);
      
      if (nextAccountElement) {
        const rect = nextAccountElement.getBoundingClientRect();
        const targetScrollY = window.pageYOffset + rect.top - 20; // 20 pixels above
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
        
        // Add red glow highlight effect (doesn't affect timing)
        setTimeout(() => {
          nextAccountElement.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
          setTimeout(() => {
            nextAccountElement.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
          }, 300);
        }, 100);
        return;
      }
    } else {
      // If all negative accounts are disputed, do nothing here
      // The main logic in handleAccountDisputeSaved handles the section collapse
      console.log("All negative accounts disputed - main logic will handle section collapse");
    }
  };

  const scrollToNextNegativeAccount = () => {
    
    // If no undisputed public records, check if there are any public records and scroll to that section
    if (hasPublicRecords()) {
      const publicRecordsSection = document.querySelector('[data-section="public-records"]');
      if (publicRecordsSection) {
        console.log("Scrolling to public records section...");
        publicRecordsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Add a brief highlight effect to the pink Card that contains the numbered circles
        console.log("Looking for highlight target...");
        const allCards = document.querySelectorAll('[data-highlight-target]');
        console.log("All cards with data-highlight-target:", allCards);
        const firstNegativeCard = document.querySelector('[data-highlight-target="true"]');
        console.log("First negative card found:", firstNegativeCard);
        if (firstNegativeCard) {
          console.log("Adding highlight to:", firstNegativeCard);
          firstNegativeCard.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
          setTimeout(() => {
            firstNegativeCard.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
          }, 300);
        } else {
          console.log("No highlight target found, trying fallback selector");
          const fallbackCard = document.querySelector('.bg-red-50');
          console.log("Fallback card:", fallbackCard);
          if (fallbackCard) {
            fallbackCard.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
            setTimeout(() => {
              fallbackCard.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
            }, 300);
          }
        }
        return;
      }
    }
    
    // Look for the negative accounts section by finding the heading
    const negativeAccountsSection = Array.from(document.querySelectorAll('.mb-6')).find(el => {
      const heading = el.querySelector('h3');
      return heading && heading.textContent && heading.textContent.toLowerCase().includes('negative account');
    });
    
    if (negativeAccountsSection) {
      console.log("Scrolling to negative accounts section header...");
      // Calculate position to scroll to 3/4 inch (about 54px) above the pink section
      const rect = negativeAccountsSection.getBoundingClientRect();
      const offsetTop = window.pageYOffset + rect.top - 54; // 54px ≈ 3/4 inch
      
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      
      // Add highlight effect to the first pink Card that contains the numbered circles
      setTimeout(() => {
        const firstNegativeCard = document.querySelector('[data-highlight-target="true"]');
        console.log("Looking for first negative card:", firstNegativeCard);
        if (firstNegativeCard) {
          console.log("Adding highlight to:", firstNegativeCard);
          firstNegativeCard.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
          setTimeout(() => {
            firstNegativeCard.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
          }, 300);
        } else {
          console.log("Trying fallback selector...");
          const fallbackCard = document.querySelector('.bg-red-50');
          if (fallbackCard) {
            fallbackCard.classList.add('ring-4', 'ring-red-400', 'ring-opacity-75');
            setTimeout(() => {
              fallbackCard.classList.remove('ring-4', 'ring-red-400', 'ring-opacity-75');
            }, 300);
          }
        }
      }, 100); // Faster response time
      return;
    }
    
    // Fallback: if section header not found, alert user
    alert("Negative accounts section not found. Make sure you've run the AI scan first.");
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <CreditReportHeader 
        onShowTutorial={() => setShowInstructionalVideo(true)}
        showInstructionalVideo={showInstructionalVideo}
      />
      
      {/* Confetti Animation */}
      <Confetti 
        trigger={confettiTrigger} 
        colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']}
        particleCount={60}
      />
      
      {/* Main Content Container - CRC Professional Layout */}
      <Container maxWidth="xl" sx={{ 
        py: 3,
        px: { xs: 2, sm: 3, md: 4 }
      }}>


        {/* Instructional Video Section - Desktop Only */}
        {showInstructionalVideo && (
          <Box sx={{ display: { xs: 'none', md: 'block' }, mb: 4 }}>
            <Card sx={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      backgroundColor: 'primary.main', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Play size={24} color="white" />
                    </Box>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#1e293b',
                          fontSize: '1.125rem',
                          fontFamily: '"Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                        }}
                      >
                        How to Use This Credit Repair Tool
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#64748b',
                          fontSize: '0.875rem',
                          fontFamily: '"Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                        }}
                      >
                        Learn the step-by-step process in just 3 minutes
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleDismissVideo}
                    sx={{ color: 'grey.500', '&:hover': { color: 'grey.700' } }}
                  >
                    <X size={20} />
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    p: 0.5, 
                    boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)', 
                    maxWidth: 400, 
                    width: '100%' 
                  }}>
                    <iframe
                      width="100%"
                      height="250"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      title="Credit Repair Tutorial"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ borderRadius: 8 }}
                    ></iframe>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">• Step 1: Run AI Analysis</Typography>
                    <Typography variant="body2" color="text.secondary">• Step 2: Select Items to Dispute</Typography>
                    <Typography variant="body2" color="text.secondary">• Step 3: Generate Letters</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleDismissVideo}
                    sx={{ 
                      color: 'primary.main', 
                      borderColor: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.50' }
                    }}
                  >
                    Got it, hide this
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}



        {/* Name Section - Step 2: CRC Professional Typography */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              color: '#0f172a',
              fontSize: { xs: '2.25rem', md: '3rem' },
              mb: 1,
              letterSpacing: '-0.025em',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            {creditData ? `${creditData.CREDIT_RESPONSE.BORROWER["@_FirstName"]} ${creditData.CREDIT_RESPONSE.BORROWER["@_LastName"]}` : 'DONALD BLAIR'}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#475569',
              fontSize: '1rem',
              fontWeight: 500,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            SSN: {creditData && creditData.CREDIT_RESPONSE.BORROWER["@_SSN"] && 
              creditData.CREDIT_RESPONSE.BORROWER["@_SSN"] !== "XXXXXXXXX" ? 
                `XXX-XX-${creditData.CREDIT_RESPONSE.BORROWER["@_SSN"].slice(-4)}` : 
                'XXX-XX-XXXX'}
          </Typography>
        </Box>



        {/* AI-Powered Compliance Scan */}
        <div className="mb-8">
          <div className="flex justify-center">
            {!showAiSummary ? (
              <div>
                <Button 
                  onClick={handleAiScan} 
                  disabled={isAiScanning}
                  variant="contained"
                  sx={{
                    backgroundColor: '#2563eb',
                    '&:hover': {
                      backgroundColor: '#1d4ed8',
                      transform: 'scale(1.02)'
                    },
                    color: 'white',
                    fontSize: { xs: '1.25rem', md: '2.5rem' },
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: 3,
                    transition: 'all 0.2s',
                    minWidth: { xs: '220px', md: '280px' },
                    minHeight: { xs: '50px', md: '50px' },
                    px: { xs: 2, md: 4 },
                    py: { xs: 1.5, md: 1.5 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isAiScanning ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={20} sx={{ color: 'white', mr: 1.5 }} />
                      <Typography sx={{ color: 'white' }}>Scanning...</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      width: '100%'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mb: { xs: 0, md: 1 }
                      }}>
                        <Zap 
                          size={20} 
                          className="text-white animate-pulse mr-2"
                        />
                        <Typography sx={{ 
                          color: 'white', 
                          fontWeight: 600, 
                          textTransform: 'none',
                          fontSize: { xs: '1.3rem', md: '1.4rem' },
                          whiteSpace: 'nowrap'
                        }}>
                          AI Metro 2 / Compliance Scan
                        </Typography>
                        <Zap 
                          size={20} 
                          className="text-white animate-pulse ml-2"
                        />
                      </Box>
                      <Typography sx={{ 
                        fontSize: '10px',
                        color: 'white',
                        opacity: 0.8,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        px: 3,
                        display: { xs: 'none', md: 'block' },
                        textTransform: 'none'
                      }}>
                        Powered by AI to identify violations and generate best practice dispute suggestions
                      </Typography>
                    </Box>
                  )}
                </Button>
              </div>
            ) : (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 mx-4 max-w-2xl relative" data-section="scan-complete">
                <button
                  onClick={() => setShowAiSummary(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Header with AI branding */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#2563eb] rounded-full flex items-center justify-center shadow-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-900">AI Analysis Complete</h3>
                      <p className="text-sm text-gray-500 font-medium">Powered by Open AI</p>
                    </div>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-2">{aiSummaryData.totalViolations}</div>
                    <div className="text-xl font-semibold text-gray-700 mb-3">Violations Detected</div>
                    {(() => {
                      const metro2Count = Math.floor(aiSummaryData.totalViolations * 0.6);
                      const fcraCount = aiSummaryData.totalViolations - metro2Count;
                      if (metro2Count > 0 && fcraCount > 0) {
                        return (
                          <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{metro2Count}</div>
                              <div className="text-sm text-gray-600">Metro 2</div>
                            </div>
                            <div className="w-px h-8 bg-gray-300"></div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">{fcraCount}</div>
                              <div className="text-sm text-gray-600">FCRA</div>
                            </div>
                          </div>
                        );
                      } else if (metro2Count > 0) {
                        return <div className="text-base text-blue-600 font-medium">{metro2Count} Metro 2 Violations</div>;
                      } else if (fcraCount > 0) {
                        return <div className="text-base text-purple-600 font-medium">{fcraCount} FCRA Violations</div>;
                      }
                      return null;
                    })()}
                  </div>
                  
                  {aiScanCompleted && aiSummaryData.totalViolations > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-800 font-semibold text-base hidden sm:inline">AI-Generated Dispute Strategies Available</span>
                        <span className="text-green-800 font-semibold text-base sm:hidden">AI-Dispute Strategies Available</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Next Step Button */}
                <button 
                  onClick={() => {
                    // Close the modal first
                    setShowAiSummary(false);
                    
                    // Then scroll to Quick Start instructions after a short delay
                    setTimeout(() => {
                      const quickStartBox = document.getElementById('quick-start-instructions');
                      if (quickStartBox) {
                        const rect = quickStartBox.getBoundingClientRect();
                        const offsetTop = window.pageYOffset + rect.top - 30;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                      }
                    }, 200);
                  }}
                  className="relative w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg p-4 transition-all duration-200 shadow-md hover:shadow-lg overflow-hidden"
                >
                  {/* Magical shimmer effect - triggers once on modal appear */}
                  <div className="absolute inset-0 -top-4 -bottom-4 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%]" 
                       style={{
                         background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), rgba(255,255,255,0.6), rgba(255,255,255,0.4), transparent)',
                         animation: 'shimmer 1.5s ease-out 0.5s forwards'
                       }}></div>
                  
                  {/* Glow effect on first appearance */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-400/20" 
                       style={{
                         animation: 'magicalGlow 2s ease-in-out 0.3s forwards'
                       }}></div>
                  <div className="flex items-center justify-center">
                    <span className="font-semibold text-base hidden sm:inline">Continue to Credit Scores & Process Report</span>
                    <span className="font-semibold text-base sm:hidden">Continue to Process Report</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                </div>
              </div>
            )}

            {isAiScanning && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mx-4 max-w-2xl shadow-2xl">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-[#2563eb] rounded-full flex items-center justify-center mx-auto">
                        <Zap className="w-8 h-8 text-white animate-pulse" />
                      </div>
                      <div className="absolute -inset-2 bg-[#2563eb] rounded-full opacity-20 animate-ping"></div>
                      <div className="absolute -inset-4 bg-[#2563eb] rounded-full opacity-10 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Metro 2 Analysis</h3>
                      <p className="text-gray-600">Scanning for compliance violations</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-gray-700 bg-white rounded-lg p-3 shadow-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Analyzing negative accounts...</span>
                        <div className="flex space-x-1 ml-auto">
                          <div className="w-1 h-4 bg-purple-400 rounded animate-pulse"></div>
                          <div className="w-1 h-3 bg-indigo-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-5 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-gray-700 bg-white rounded-lg p-3 shadow-sm">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <span>Checking Metro 2 standards...</span>
                        <div className="flex space-x-1 ml-auto">
                          <div className="w-1 h-4 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                          <div className="w-1 h-3 bg-indigo-400 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-gray-700 bg-white rounded-lg p-3 shadow-sm">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <span>Identifying violations...</span>
                        <div className="flex space-x-1 ml-auto">
                          <div className="w-1 h-3 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                          <div className="w-1 h-5 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <div className="flex space-x-1">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-0 animate-pulse"
                            style={{ 
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: '1s',
                              animationFillMode: 'forwards'
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>








        <div className="mt-12">
          {/* Instructions for first-time visitors */}
          <div id="quick-start-instructions" className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Quick Start:</strong> Look for red negative items or any inaccuracies below. Select a reason and instructions for each, then click save to continue.
            </p>
          </div>

          {/* Credit Scores */}
          <div className="mb-12 mt-12" data-section="credit-scores">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-gray-900">Credit Scores</h3>
              </div>
            </div>




            {/* Compact Score Gauges */}
            <div className="mb-6">
              <Card className="border-2 border-gray-200 bg-white p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* TransUnion - Circular Gauge */}
                  <div className="space-y-3 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <div className="flex items-start justify-center h-10 mb-2 -mt-1">
                      <img src={transUnionLogo} alt="TransUnion" className="h-9 object-contain" />
                    </div>
                    
                    {/* Score Gauge with PNG */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-24 mb-3">
                        <img src={scoreGaugeArc} alt="Score Gauge" className="w-full h-full object-contain" />
                        
                        {/* Very Good text - positioned above score but under arc */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginBottom: '20px' }}>
                          <div className="text-xs font-semibold text-gray-500">
                            Very Good
                          </div>
                        </div>
                        
                        {/* Score in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-end" style={{ marginBottom: '-5px' }}>
                          <div className="text-5xl font-black text-gray-700">742</div>
                        </div>
                        
                        {/* Score Change Badge - Top Right */}
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          +12
                        </div>
                      </div>
                      
                      {/* Starting Score Text */}
                      <div className="text-sm font-medium text-gray-600 mt-2">
                        Starting Score: 590
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Equifax - Circular Gauge */}
                  <div className="space-y-3 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <div className="flex items-center justify-center h-10 mb-2">
                      <img src={equifaxLogo} alt="Equifax" className="h-6 object-contain" />
                    </div>
                    
                    {/* Score Gauge with PNG */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-24 mb-3">
                        <img src={scoreGaugeArc} alt="Score Gauge" className="w-full h-full object-contain" />
                        
                        {/* Fair text - positioned above score but under arc */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginBottom: '20px' }}>
                          <div className="text-xs font-semibold text-gray-500">
                            Fair
                          </div>
                        </div>
                        
                        {/* Score in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-end" style={{ marginBottom: '-5px' }}>
                          <div className="text-5xl font-black text-gray-700">687</div>
                        </div>
                        
                        {/* Score Change Badge - Top Right */}
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          +18
                        </div>
                      </div>
                      
                      {/* Starting Score Text */}
                      <div className="text-sm font-medium text-gray-600 mt-2">
                        Starting Score: 590
                      </div>
                    </div>
                  </div>
                  
                  {/* Experian - Circular Gauge */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center h-10 mb-2">
                      <img src={experianLogo} alt="Experian" className="h-9 object-contain" />
                    </div>
                    
                    {/* Score Gauge with PNG */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-24 mb-3">
                        <img src={scoreGaugeArc} alt="Score Gauge" className="w-full h-full object-contain" />
                        
                        {/* Very Good text - positioned above score but under arc */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginBottom: '20px' }}>
                          <div className="text-xs font-semibold text-gray-500">
                            Very Good
                          </div>
                        </div>
                        
                        {/* Score in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-end" style={{ marginBottom: '-5px' }}>
                          <div className="text-5xl font-black text-gray-700">756</div>
                        </div>
                        
                        {/* Score Change Badge - Top Right */}
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          +15
                        </div>
                      </div>
                      
                      {/* Starting Score Text */}
                      <div className="text-sm font-medium text-gray-600 mt-2">
                        Starting Score: 590
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Outstanding Progress Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-green-800 font-bold text-lg mb-1">
                    Outstanding Progress! +244 Total Points Gained! 
                    <span className="text-green-700 text-sm font-normal ml-2 hidden md:inline">Credit Hero, you've transformed this client's credit profile - incredible work!</span>
                  </h4>
                </div>
              </div>
            </div>

            {/* Account Summary - moved directly below credit scores */}
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Points Raised */}
                <Card className="bg-white border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="text-lg md:text-lg font-bold text-green-600">+122</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-700">
                        <span className="md:hidden font-medium">Points Raised</span>
                        <span className="hidden md:inline"><span className="font-medium">Points Raised</span> since start of credit repair</span>
                      </div>
                      <div className="text-xs text-gray-400 md:hidden">since start of repair</div>
                    </div>
                    <div className="text-green-500 hidden md:block">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                {/* Points Gained */}
                <Card className="bg-white border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="text-lg md:text-lg font-bold text-green-600">+35</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-700">
                        <span className="md:hidden font-medium">Points Gained</span>
                        <span className="hidden md:inline"><span className="font-medium">Points Gained</span> since last import</span>
                      </div>
                      <div className="text-xs text-gray-400 md:hidden">since last import</div>
                    </div>
                    <div className="text-green-500 hidden md:block">
                      <ArrowUp className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                {/* Items Removed */}
                <Card className="bg-white border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="text-lg md:text-lg font-bold text-green-600">23</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-700">
                        <span className="md:hidden font-medium">Items Removed</span>
                        <span className="hidden md:inline"><span className="font-medium">Items Removed</span> since start of credit repair</span>
                      </div>
                      <div className="text-xs text-gray-400 md:hidden">since start of repair</div>
                    </div>
                    <div className="text-green-500 hidden md:block">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                {/* Negative Items */}
                <Card className="bg-white border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="text-lg md:text-lg font-bold text-red-600">13</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-700">
                        <span className="md:hidden font-medium">Negative Items</span>
                        <span className="hidden md:inline"><span className="font-medium">Negative Items</span> in the report below</span>
                      </div>
                      <div className="text-xs text-gray-400 md:hidden">in the report below</div>
                    </div>
                    <div className="text-red-500 hidden md:block">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </Card>

                {/* Inquiries With Impact */}
                <Card className="bg-white border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <div className="text-lg md:text-lg font-bold text-orange-600">28</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-700">
                        <span className="md:hidden font-medium">Inquiries With Impact</span>
                        <span className="hidden md:inline"><span className="font-medium">Inquiries With Impact</span><br />+25 with no impact</span>
                      </div>
                      <div className="text-xs text-gray-400 md:hidden">+25 with no impact</div>
                    </div>
                    <div className="text-orange-500 hidden md:block">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </div>
            </div>



            {/* Credit Summary Section */}
            <div className="mb-12 mt-12" data-section="credit-summary">
              <CreditSummary creditData={creditData} />
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="mb-12 mt-12" data-section="personal-info">
            <div className="flex items-start md:items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className={`text-2xl font-bold ${personalInfoCollapsed ? 'text-green-800 flex items-center gap-2' : 'text-gray-900'}`}>
                  {personalInfoCollapsed && <span className="text-green-600">✓</span>}
                  Personal Information
                </h3>
              </div>
              {!personalInfoCollapsed && (
                <div className="ml-auto hidden md:block">
                  <div className="text-xs text-gray-500">Removing old personal info tied to bad accounts helps for deleting them</div>
                </div>
              )}
            </div>
            
            {personalInfoCollapsed ? (
              // Collapsed state showing saved dispute
              <div 
                className="flex items-center justify-between p-4 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => setPersonalInfoCollapsed(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-center h-12">
                    <h3 className="font-semibold text-green-700">
                      {(() => {
                        if (personalInfoDispute?.selectedItems) {
                          const selectedKeys = personalInfoDispute.selectedItems;
                          const count = selectedKeys.length;
                          const itemText = count === 1 ? 'Dispute' : 'Disputes';
                          return `${count} ${itemText} Completed`;
                        }
                        return 'Dispute Completed';
                      })()} <span className="text-sm text-green-600 font-medium">
                        ({(() => {
                          if (personalInfoDispute?.selectedItems) {
                            const selectedKeys = personalInfoDispute.selectedItems;
                            
                            // Create a set to avoid duplicates when multiple bureaus have same item type
                            const uniqueTypes = new Set();
                            
                            selectedKeys.forEach((key: string) => {
                              // Extract item type from keys like "transunion-name", "equifax-current-address"
                              if (key.includes('name')) uniqueTypes.add('Name');
                              else if (key.includes('birth') || key.includes('dob')) uniqueTypes.add('Date of Birth');
                              else if (key.includes('ssn') || key.includes('social')) uniqueTypes.add('Social Security');
                              else if (key.includes('current-address')) uniqueTypes.add('Current Address');
                              else if (key.includes('previous-address')) uniqueTypes.add('Previous Address');
                              else if (key.includes('phone')) uniqueTypes.add('Phone Number');
                              else if (key.includes('alias') || key.includes('former')) uniqueTypes.add('Former Names');
                              else if (key.includes('current-employer')) uniqueTypes.add('Current Employer');
                              else if (key.includes('previous-employer')) uniqueTypes.add('Previous Employer');
                              else {
                                // Fallback: capitalize the last part after dash
                                const parts = key.split('-');
                                const itemType = parts[parts.length - 1];
                                uniqueTypes.add(itemType.charAt(0).toUpperCase() + itemType.slice(1));
                              }
                            });
                            
                            return Array.from(uniqueTypes).join(', ');
                          }
                          return 'Personal Information Items';
                        })()})
                      </span>
                    </h3>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-600" />
              </div>
            ) : (
              // Expanded state showing the full component
              <ModernPersonalInfo 
                borrower={creditData.CREDIT_RESPONSE.BORROWER}
                reportInfo={{
                  "@CreditResponseID": creditData.CREDIT_RESPONSE["@CreditResponseID"],
                  "@CreditReportFirstIssuedDate": creditData.CREDIT_RESPONSE["@CreditReportFirstIssuedDate"]
                }}
                onDisputeSaved={handlePersonalInfoDisputeSaved}
                initialSelections={personalInfoSelections}
                initialDisputeData={personalInfoDispute}
                forceExpanded={!!personalInfoDispute}
              />
            )}
          </div>

          {/* Hard Inquiries Section */}
          <div className="mb-12 mt-12" data-section="inquiries">
            <div className="flex items-start md:items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className={`text-2xl font-bold ${hardInquiriesCollapsed ? 'text-green-800 flex items-center gap-2' : 'text-gray-900'}`}>
                  {hardInquiriesCollapsed && <span className="text-green-600">✓</span>}
                  Hard Inquiries
                </h3>
              </div>
              {!hardInquiriesCollapsed && (
                <div className="ml-auto hidden md:block">
                  <div className="text-xs text-gray-500">*Inquiries older than 24 months do not impact the score</div>
                </div>
              )}
            </div>
            {!hardInquiriesCollapsed && (
              <div className="text-xs text-gray-500 mb-6 md:hidden">*Inquiries older than 24 months don't impact score</div>
            )}
            
            {hardInquiriesCollapsed ? (
              // Collapsed state showing saved dispute
              <div 
                className="flex items-center justify-between p-4 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => setHardInquiriesCollapsed(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-center h-12">
                    <h3 className="font-semibold text-green-700">
                      {(() => {
                        // Count selected inquiries from hardInquiriesDispute if it exists
                        const selectedCount = hardInquiriesDispute?.selectedItems ? 
                          Object.values(hardInquiriesDispute.selectedItems).filter(Boolean).length : 0;
                        if (selectedCount === 0) return 'Section completed';
                        return `${selectedCount} inquiry dispute${selectedCount === 1 ? '' : 's'} saved`;
                      })()}
                    </h3>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-600" />
              </div>
            ) : (
              // Expanded state showing the full component
              <ModernInquiries 
                creditData={creditData} 
                onDisputeSaved={handleHardInquiriesDisputeSaved}
                initialDisputeData={hardInquiriesDispute}
                forceExpanded={!!hardInquiriesDispute}
              />
            )}
          </div>

          {/* Credit Accounts Section */}
          <div className="mb-12 mt-12" data-section="credit-accounts" data-account-section="true">
            {allAccountsCollapsed ? (
              // Collapsed view - show small summary card
              <div>
                <div className="flex justify-between items-end mb-6">
                  <div className="flex items-start md:items-center gap-3 flex-1">
                    <div>
                      <h2 className="text-2xl font-bold text-green-800 transition-colors duration-300 flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        Credit Accounts
                      </h2>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="flex items-center justify-between p-4 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => setAllAccountsCollapsed(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex items-center h-12">
                      <h3 className="font-semibold text-green-700">
                        {Object.keys(savedDisputes).length} Account Disputes Completed <span className="text-sm text-green-600 font-medium">(All Negative Accounts Disputed)</span>
                      </h3>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            ) : (
              // Normal view
              <div>
                <div className="flex items-start md:items-center justify-between gap-3 mb-6">
                  <div className="flex items-start md:items-center gap-3">
                    <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                      areAllNegativeAccountsSaved() ? 'text-green-800' : 'text-gray-900'
                    }`}>
                      {areAllNegativeAccountsSaved() && <span className="text-green-600">✓</span>} Credit Accounts
                    </h3>
                  </div>
                  
                  {/* Switch-style Toggle - Hidden on mobile */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {showPositivesFirst ? 'Positives First' : 'Report Order'}
                      </span>
                      <button
                        onClick={() => setShowPositivesFirst(!showPositivesFirst)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          showPositivesFirst ? 'bg-gray-300' : 'bg-blue-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            showPositivesFirst ? 'translate-x-1' : 'translate-x-6'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
            


            <div>
              {/* Display accounts with custom spacing control */}
              {(() => {
                const elements = [];
                
                if (showPositivesFirst) {
                  // Group by type when "Positives First" is enabled
                  const positiveAccounts = uniqueAccounts.filter(account => 
                    !isNegativeAccount(account) && !isClosedAccount(account)
                  );
                  const closedAccounts = uniqueAccounts.filter(account => 
                    isClosedAccount(account) && !isNegativeAccount(account)
                  );
                  const negativeAccounts = uniqueAccounts.filter(account => 
                    isNegativeAccount(account)
                  );
                  
                  // Add combined positive and closed accounts section
                  if (positiveAccounts.length > 0 || closedAccounts.length > 0) {
                    const totalAccounts = positiveAccounts.length + closedAccounts.length;
                    
                    // Collapsed combined accounts section
                    if (!showPositiveAndClosedAccounts) {
                      elements.push(
                        <div key="positive-closed-accounts-collapsed" className="mb-6">
                          <div 
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setShowPositiveAndClosedAccounts(true)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {totalAccounts} Positive & Closed Account{totalAccounts === 1 ? '' : 's'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {positiveAccounts.length} positive{closedAccounts.length > 0 ? `, ${closedAccounts.length} closed` : ''}
                                </p>
                              </div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      );
                    }
                    
                    // Expanded combined accounts section
                    if (showPositiveAndClosedAccounts) {
                      elements.push(
                        <div key="positive-closed-accounts-expanded" className="mb-3 p-4 bg-white border border-gray-200 rounded-lg">
                          {/* Header with collapse button */}
                          <div className="mb-4">
                            <div 
                              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors p-2 -m-2 rounded"
                              onClick={() => setShowPositiveAndClosedAccounts(false)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {totalAccounts} Positive & Closed Account{totalAccounts === 1 ? '' : 's'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {positiveAccounts.length} positive{closedAccounts.length > 0 ? `, ${closedAccounts.length} closed` : ''}
                                  </p>
                                </div>
                              </div>
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Combined accounts list */}
                          <div className="space-y-6">
                            {/* Positive accounts */}
                            {positiveAccounts.map((account, index) => {
                              const accountId = account["@CreditLiabilityID"] || index.toString();
                              const accountViolations = aiScanCompleted ? (aiViolations[accountId] || []) : [];
                              
                              return (
                                <ModernAccountRow
                                  key={`positive-${accountId}`}
                                  account={account}
                                  onDispute={handleDisputeAccount}
                                  aiViolations={accountViolations}
                                  disputeReasons={disputeReasons}
                                  disputeInstructions={disputeInstructions}
                                  showDropdowns={true}
                                  onDisputeSaved={handleAccountDisputeSaved}
                                  expandAll={expandAllAccounts}
                                  aiScanCompleted={aiScanCompleted}
                                />
                              );
                            })}
                            
                            {/* Closed accounts */}
                            {closedAccounts.map((account, index) => {
                              const accountId = account["@CreditLiabilityID"] || index.toString();
                              const accountViolations = aiScanCompleted ? (aiViolations[accountId] || []) : [];
                              
                              return (
                                <ModernAccountRow
                                  key={`closed-${accountId}`}
                                  account={account}
                                  onDispute={handleDisputeAccount}
                                  aiViolations={accountViolations}
                                  disputeReasons={disputeReasons}
                                  disputeInstructions={disputeInstructions}
                                  showDropdowns={true}
                                  onDisputeSaved={handleAccountDisputeSaved}
                                  expandAll={expandAllAccounts}
                                  aiScanCompleted={aiScanCompleted}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Hide Details link at bottom */}
                          <div className="flex justify-center mt-1 pt-1 border-t border-gray-100">
                            <button
                              onClick={() => setShowPositiveAndClosedAccounts(false)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            >
                              Hide Details
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  // Add Action Required section before negative accounts
                  if (negativeAccounts.length > 0) {
                    const hasNegativeAccountsOnly = negativeAccounts.length > 0;
                    const hasPublicRecordsOnly = hasPublicRecords();
                    const hasAnyNegativeItems = hasNegativeAccountsOnly || hasPublicRecordsOnly;
                    

                    
                    // Calculate total negative items (accounts + public records)
                    const publicRecordsCount = 0; // Set to actual count when public records are implemented
                    const totalNegativeCount = negativeAccounts.length + publicRecordsCount;
                    
                    // Add negative accounts as a connected section
                    elements.push(
                      <div key="negative-accounts-section" className="mb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-t-lg border-b-0">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-600 rounded-full flex-shrink-0"></div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {totalNegativeCount} Negative Account{totalNegativeCount === 1 ? '' : 's'}
                              </h3>
                              <p className="text-sm font-medium">
                                {areAllNegativeAccountsSaved() ? (
                                  <span className="text-green-600">
                                    {Object.keys(savedDisputes).length} Disputes Saved
                                  </span>
                                ) : Object.keys(savedDisputes).length > 0 ? (
                                  <span className="text-green-600">
                                    {Object.keys(savedDisputes).length} Dispute{Object.keys(savedDisputes).length === 1 ? '' : 's'} Saved
                                  </span>
                                ) : (
                                  <span className="text-red-600">Action Required: <span className="text-sm md:text-xs text-gray-600">Complete steps 1-2-3 for each negative account below</span></span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandAllAccounts(!expandAllAccounts)}
                            className="hidden md:flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                          >
                            <span>{expandAllAccounts ? 'Collapse All' : 'Expand All'}</span>
                            <svg 
                              className={`w-4 h-4 transition-transform ${expandAllAccounts ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Connected accounts list */}
                        <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg px-4 pt-0 pb-6">
                          <div className="space-y-6">
                            {negativeAccounts.map((account, index) => {
                              const accountId = account["@CreditLiabilityID"] || index.toString();
                              const accountViolations = aiScanCompleted ? (aiViolations[accountId] || []) : [];
                              
                              return (
                                <ModernAccountRow
                                  key={`negative-${accountId}`}
                                  account={account}
                                  onDispute={handleDisputeAccount}
                                  aiViolations={accountViolations}
                                  disputeReasons={disputeReasons}
                                  disputeInstructions={disputeInstructions}
                                  showDropdowns={true}
                                  onDisputeSaved={handleAccountDisputeSaved}
                                  expandAll={expandAllAccounts}
                                  aiScanCompleted={aiScanCompleted}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Clean slate - no negative accounts with header and 3 bureau columns
                    elements.push(
                      <div key="no-negative-accounts-section" className="mb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-t-lg border-b-0">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-600 rounded-full flex-shrink-0"></div>
                            <div>
                              <h3 className="font-semibold text-gray-900">0 Negative Accounts</h3>
                              <p className="text-sm text-green-600 font-medium">Clean Credit Profile</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Clean slate content with 3 bureau columns */}
                        <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* TransUnion Clean Slate */}
                            <div className="flex flex-col">
                              <div className="mb-3">
                                <h4 className="font-bold text-cyan-700">TransUnion</h4>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="flex items-center justify-center mx-auto mb-3">
                                    <ThumbsUp className="w-10 h-10 text-green-600" />
                                  </div>
                                  <h5 className="text-lg font-semibold text-gray-900 mb-2">Clean slate!</h5>
                                  <p className="text-sm text-gray-500">No negative accounts</p>
                                </div>
                              </div>
                            </div>

                            {/* Equifax Clean Slate */}
                            <div className="flex flex-col">
                              <div className="mb-3">
                                <h4 className="font-bold text-red-600">Equifax</h4>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="flex items-center justify-center mx-auto mb-3">
                                    <ThumbsUp className="w-10 h-10 text-green-600" />
                                  </div>
                                  <h5 className="text-lg font-semibold text-gray-900 mb-2">Clean slate!</h5>
                                  <p className="text-sm text-gray-500">No negative accounts</p>
                                </div>
                              </div>
                            </div>

                            {/* Experian Clean Slate */}
                            <div className="flex flex-col">
                              <div className="mb-3">
                                <h4 className="font-bold text-blue-700">Experian</h4>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="flex items-center justify-center mx-auto mb-3">
                                    <ThumbsUp className="w-10 h-10 text-green-600" />
                                  </div>
                                  <h5 className="text-lg font-semibold text-gray-900 mb-2">Clean slate!</h5>
                                  <p className="text-sm text-gray-500">No negative accounts</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                } else {
                  // Report order - display all accounts in original sequence without grouping
                  uniqueAccounts.forEach((account, index) => {
                    const accountId = account["@CreditLiabilityID"] || index.toString();
                    const accountViolations = aiScanCompleted ? (aiViolations[accountId] || []) : [];
                    const accountType = isNegativeAccount(account) ? 'negative' : 
                                      isClosedAccount(account) ? 'closed' : 'positive';
                    
                    elements.push(
                      <div key={`${accountType}-${accountId}`} className="mb-6">
                        <ModernAccountRow
                          account={account}
                          onDispute={handleDisputeAccount}
                          aiViolations={accountViolations}
                          disputeReasons={disputeReasons}
                          disputeInstructions={disputeInstructions}
                          showDropdowns={true}
                          onDisputeSaved={handleAccountDisputeSaved}
                          expandAll={expandAllAccounts}
                          aiScanCompleted={aiScanCompleted}
                        />
                      </div>
                    );
                  });
                }
                
                return elements;
              })()}
            </div>
              </div>
            )}
          </div>

          {/* Public Records Section */}
          <div className="mb-12 mt-12" data-section="public-records">
            <div className="flex items-start md:items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className={`text-2xl font-bold ${allPublicRecordsCollapsed || areAllPublicRecordsSavedWithUpdatedState(savedDisputes) ? 'text-green-800 flex items-center gap-2' : 'text-gray-900'}`}>
                  {(allPublicRecordsCollapsed || areAllPublicRecordsSavedWithUpdatedState(savedDisputes)) && <span className="text-green-600">✓</span>}
                  Public Records
                </h3>


              </div>
              {!allPublicRecordsCollapsed && (
                <div className="ml-auto hidden md:block">
                  {/* Show up arrow if all public records are saved but expanded, otherwise show info text */}
                  {areAllPublicRecordsSavedWithUpdatedState(savedDisputes) ? (
                    <button
                      onClick={() => setAllPublicRecordsCollapsed(true)}
                      className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="text-xs text-gray-500">Things that can show up on a background check can also show up on your credit report, including bankruptcies.</div>
                  )}
                </div>
              )}
            </div>
            {!allPublicRecordsCollapsed && (
              <div className="md:hidden mb-4">
                {areAllPublicRecordsSavedWithUpdatedState(savedDisputes) ? (
                  <button
                    onClick={() => setAllPublicRecordsCollapsed(true)}
                    className="flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 transition-colors mx-auto"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-xs text-gray-500">Things that can show up on a background check can also show up on your credit report, including bankruptcies.</div>
                )}
              </div>
            )}
            
            {/* Conditional Display - Check if there are public records */}
            {(() => {
              const hasPublicRecords = true;
              
              if (allPublicRecordsCollapsed) {
                // Collapsed state showing saved disputes
                return (
                  <div 
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Store current scroll position to maintain it
                      const currentScrollY = window.pageYOffset;
                      
                      setIsManuallyReopeningPublicRecords(true);
                      setAllPublicRecordsCollapsed(false);
                      
                      // Restore scroll position after a brief delay
                      setTimeout(() => {
                        window.scrollTo(0, currentScrollY);
                      }, 50);
                      
                      // Clear the flag after a longer delay to allow normal operations to resume
                      setTimeout(() => setIsManuallyReopeningPublicRecords(false), 2000);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex items-center h-12">
                        <h3 className="font-semibold text-green-700">
                          3 Public Record Disputes Saved <span className="text-sm text-green-600 font-medium">(Bankruptcy, Lien, Judgment)</span>
                        </h3>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  </div>
                );
              } else if (!hasPublicRecords) {
                // Clean Slate Display - White container with three gray boxes inside
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* TransUnion Clean Slate */}
                      <div className="flex flex-col">
                        <div className="mb-3">
                          <h4 className="font-bold text-cyan-700">TransUnion</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                          <div className="text-center">
                            <div className="flex items-center justify-center mx-auto mb-3">
                              <ThumbsUp className="w-10 h-10 text-green-600" />
                            </div>
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Clean slate!</h5>
                            <p className="text-sm text-gray-500">You have no public records</p>
                          </div>
                        </div>
                      </div>

                      {/* Equifax Clean Slate */}
                      <div className="flex flex-col">
                        <div className="mb-3">
                          <h4 className="font-bold text-red-600">Equifax</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                          <div className="text-center">
                            <div className="flex items-center justify-center mx-auto mb-3">
                              <ThumbsUp className="w-10 h-10 text-green-600" />
                            </div>
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Clean slate!</h5>
                            <p className="text-sm text-gray-500">You have no public records</p>
                          </div>
                        </div>
                      </div>

                      {/* Experian Clean Slate */}
                      <div className="flex flex-col">
                        <div className="mb-3">
                          <h4 className="font-bold text-blue-700">Experian</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 flex items-center justify-center">
                          <div className="text-center">
                            <div className="flex items-center justify-center mx-auto mb-3">
                              <ThumbsUp className="w-10 h-10 text-green-600" />
                            </div>
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Clean slate!</h5>
                            <p className="text-sm text-gray-500">You have no public records</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Multiple Public Records Display
                return (
                  <div className="space-y-6">
                    {/* Bankruptcy Record */}
                    {(() => {
                      const bankruptcyRecord = {
                        "@_AccountIdentifier": "BANKRUPTCY-001",
                        "@_SubscriberName": "U.S. BANKRUPTCY COURT",
                        "@_AccountType": "Bankruptcy",
                        "@_DerogatoryDataIndicator": "Y",
                        "@_AccountOpenedDate": "2019-03-15",
                        "@_AccountClosedDate": "2019-09-15",
                        "@_CurrentBalance": "0",
                        "@_UnpaidBalanceAmount": "45000",
                        "@_AccountStatusType": "Discharged",
                        "publicRecordType": "Chapter 7 Bankruptcy",
                        "courtName": "U.S. Bankruptcy Court - District of Nevada",
                        "caseNumber": "19-12345-LBR",
                        "filingDate": "2019-03-15",
                        "dischargeDate": "2019-09-15",
                        "liabilities": "$45,000",
                        "assets": "$12,500",
                        "status": "Discharged"
                      };
                      const accountId = "BANKRUPTCY-001";
                      const accountViolations = aiScanCompleted ? (aiViolations[accountId] || []) : [];
                      
                      return (
                        <ModernAccountRow
                          key={accountId}
                          account={bankruptcyRecord}
                          onDispute={handleDisputeAccount}
                          aiViolations={accountViolations}
                          disputeReasons={disputeReasons}
                          disputeInstructions={disputeInstructions}
                          showDropdowns={true}
                          onDisputeSaved={handlePublicRecordDisputeSaved}
                          aiScanCompleted={aiScanCompleted}
                          savedDisputes={savedDisputes}
                        />
                      );
                    })()}

                    {/* Tax Lien Record */}
                    {(() => {
                      const lienRecord = {
                        "@_AccountIdentifier": "LIEN-001",
                        "@_SubscriberName": "IRS TAX LIEN",
                        "@_AccountType": "Tax Lien",
                        "@_DerogatoryDataIndicator": "Y",
                        "@_AccountOpenedDate": "2020-08-12",
                        "@_AccountClosedDate": "2023-02-28",
                        "@_CurrentBalance": "0",
                        "@_UnpaidBalanceAmount": "12500",
                        "@_AccountStatusType": "Released",
                        "publicRecordType": "Federal Tax Lien",
                        "courtName": "U.S. District Court - Central District",
                        "caseNumber": "20-TL-7890",
                        "filingDate": "2020-08-12",
                        "releaseDate": "2023-02-28",
                        "originalAmount": "$12,500",
                        "status": "Released"
                      };
                      const accountId = "LIEN-001";
                      const accountViolations = aiScanCompleted ? (aiViolations[accountId] || []) : [];
                      
                      return (
                        <ModernAccountRow
                          key={accountId}
                          account={lienRecord}
                          onDispute={handleDisputeAccount}
                          aiViolations={accountViolations}
                          disputeReasons={disputeReasons}
                          disputeInstructions={disputeInstructions}
                          showDropdowns={true}
                          onDisputeSaved={handlePublicRecordDisputeSaved}
                          aiScanCompleted={aiScanCompleted}
                          savedDisputes={savedDisputes}
                        />
                      );
                    })()}

                    {/* Civil Judgment Record */}
                    {(() => {
                      const judgmentRecord = {
                        "@_AccountIdentifier": "JUDGMENT-001",
                        "@_SubscriberName": "SUPERIOR COURT",
                        "@_AccountType": "Civil Judgment",
                        "@_DerogatoryDataIndicator": "Y",
                        "@_AccountOpenedDate": "2018-11-05",
                        "@_AccountClosedDate": "2022-06-15",
                        "@_CurrentBalance": "0",
                        "@_UnpaidBalanceAmount": "8750",
                        "@_AccountStatusType": "Satisfied",
                        "publicRecordType": "Civil Judgment",
                        "courtName": "Superior Court of California",
                        "caseNumber": "18-CV-4567",
                        "filingDate": "2018-11-05",
                        "satisfactionDate": "2022-06-15",
                        "judgmentAmount": "$8,750",
                        "plaintiff": "ABC Collections LLC",
                        "status": "Satisfied"
                      };
                      const accountId = "JUDGMENT-001";
                      const accountViolations = aiScanCompleted ? (aiViolations[accountId] || []) : [];
                      
                      return (
                        <ModernAccountRow
                          key={accountId}
                          account={judgmentRecord}
                          onDispute={handleDisputeAccount}
                          aiViolations={accountViolations}
                          disputeReasons={disputeReasons}
                          disputeInstructions={disputeInstructions}
                          showDropdowns={true}
                          onDisputeSaved={handlePublicRecordDisputeSaved}
                          aiScanCompleted={aiScanCompleted}
                          savedDisputes={savedDisputes}
                        />
                      );
                    })()}
                  </div>
                );
              }
            })()}
          </div>

          {/* Completion Center */}
          <div className="mb-12 mt-12">
            <CompletionCenter 
              onContinueToWizard={handleContinueToWizard}
              onShowDisputeItems={handleShowDisputeItems}
            />
          </div>


        </div>



        </Container>

        <DisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          accounts={accounts}
          selectedAccount={selectedAccount}
        />
      </Box>
    );
}