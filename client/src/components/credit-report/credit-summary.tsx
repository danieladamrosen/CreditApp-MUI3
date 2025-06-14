import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, Minus, PieChart, ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface CreditSummaryProps {
  creditData: any;
}

interface BureauSummary {
  totalAccounts: number;
  openAccounts: number;
  closedAccounts: number;
  delinquent: number;
  derogatory: number;
  collection: number;
  balances: number;
  payments: number;
  publicRecords: number;
  inquiries2Years: number;
}

export function CreditSummary({ creditData }: CreditSummaryProps) {
  const [showFullSummary, setShowFullSummary] = useState(false);

  if (!creditData?.CREDIT_RESPONSE) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Credit Summary</CardTitle>
          <CardDescription>Unable to load credit summary data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const calculateBureauSummary = (bureauName: string): BureauSummary => {
    const accounts = creditData.CREDIT_RESPONSE.CREDIT_LIABILITY || [];
    const inquiries = creditData.CREDIT_RESPONSE.CREDIT_INQUIRY || [];
    const publicRecords = creditData.CREDIT_RESPONSE.CREDIT_PUBLIC_RECORD || [];

    // Filter accounts by bureau - check CREDIT_REPOSITORY array for source type
    const bureauAccounts = accounts.filter((account: any) => {
      if (Array.isArray(account.CREDIT_REPOSITORY)) {
        return account.CREDIT_REPOSITORY.some((repo: any) => repo["@_SourceType"] === bureauName);
      }
      return account.CREDIT_REPOSITORY?.["@_SourceType"] === bureauName;
    });

    // Filter inquiries by bureau (last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const bureauInquiries = inquiries.filter((inquiry: any) => {
      const inquiryDate = new Date(inquiry["@_Date"] || "");
      const isFromBureau = inquiry.CREDIT_REPOSITORY?.["@_SourceType"] === bureauName;
      return isFromBureau && inquiryDate > twoYearsAgo;
    });

    // Filter public records by bureau
    const bureauPublicRecords = publicRecords.filter((record: any) => {
      if (Array.isArray(record.CREDIT_REPOSITORY)) {
        return record.CREDIT_REPOSITORY.some((repo: any) => repo["@_SourceType"] === bureauName);
      }
      return record.CREDIT_REPOSITORY?.["@_SourceType"] === bureauName;
    });

    // Calculate metrics with more accurate data parsing
    const totalAccounts = bureauAccounts.length;
    
    const openAccounts = bureauAccounts.filter((acc: any) => 
      acc["@_AccountStatusType"] === "Open" || 
      (acc["@_AccountOpenedDate"] && !acc["@_AccountClosedDate"])
    ).length;
    
    const closedAccounts = bureauAccounts.filter((acc: any) => 
      acc["@_AccountStatusType"] === "Closed" || 
      acc["@_AccountClosedDate"] || 
      acc["@IsClosedIndicator"] === "Y"
    ).length;

    const delinquent = bureauAccounts.filter((acc: any) => 
      acc["@_DerogatoryDataIndicator"] === "Y" ||
      acc["@DerogatoryDataIndicator"] === "Y" ||
      acc["@_AccountType"] === "Collection" ||
      acc["@AccountType"] === "Collection"
    ).length;

    const derogatory = bureauAccounts.filter((acc: any) => 
      acc["@_DerogatoryDataIndicator"] === "Y" ||
      acc["@DerogatoryDataIndicator"] === "Y"
    ).length;

    const collection = bureauAccounts.filter((acc: any) => 
      acc["@_AccountType"] === "Collection" ||
      acc["@AccountType"] === "Collection"
    ).length;

    const balances = bureauAccounts.reduce((sum: number, acc: any) => {
      const balance = parseFloat(acc["@_CurrentBalance"] || acc["@CurrentBalance"] || acc["@_UnpaidBalanceAmount"] || "0");
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);

    const payments = bureauAccounts.reduce((sum: number, acc: any) => {
      const payment = parseFloat(acc["@_MonthlyPaymentAmount"] || acc["@MonthlyPaymentAmount"] || "0");
      return sum + (isNaN(payment) ? 0 : payment);
    }, 0);

    return {
      totalAccounts,
      openAccounts,
      closedAccounts,
      delinquent,
      derogatory,
      collection,
      balances,
      payments,
      publicRecords: bureauPublicRecords.length,
      inquiries2Years: bureauInquiries.length
    };
  };

  const transUnionSummary = calculateBureauSummary("TransUnion");
  const equifaxSummary = calculateBureauSummary("Equifax");
  const experianSummary = calculateBureauSummary("Experian");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const MinimalBureauColumn = ({ title, summary, logoColor }: { 
    title: string; 
    summary: BureauSummary; 
    logoColor: string;
  }) => (
    <div className="flex-1">
      <div className="mb-2">
        <h3 className={`text-lg font-bold ${logoColor} text-left`}>{title}</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Total Accounts:</span>
            <span className="text-sm font-medium">{summary.totalAccounts}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Open Accounts:</span>
            <span className="text-sm font-medium">{summary.openAccounts}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Derogatory:</span>
            <span className={`text-sm font-medium ${summary.derogatory > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.derogatory}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Public Records:</span>
            <span className={`text-sm font-medium ${summary.publicRecords > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.publicRecords}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const FullBureauColumn = ({ title, summary, logoColor }: { 
    title: string; 
    summary: BureauSummary; 
    logoColor: string;
  }) => (
    <div className="flex-1">
      <div className="mb-3">
        <h3 className={`text-lg font-bold ${logoColor} text-left`}>{title}</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-0.5">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Total Accounts:</span>
            <span className="text-sm font-medium">{summary.totalAccounts}</span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Open Accounts:</span>
            <span className="text-sm font-medium">{summary.openAccounts}</span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Closed Accounts:</span>
            <span className="text-sm font-medium">{summary.closedAccounts}</span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Delinquent:</span>
            <span className={`text-sm font-medium ${summary.delinquent > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.delinquent}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Derogatory:</span>
            <span className={`text-sm font-medium ${summary.derogatory > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.derogatory}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Collection:</span>
            <span className={`text-sm font-medium ${summary.collection > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.collection}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Balances:</span>
            <span className="text-sm font-medium">{formatCurrency(summary.balances)}</span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Payments:</span>
            <span className="text-sm font-medium">{formatCurrency(summary.payments)}</span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Public Records:</span>
            <span className={`text-sm font-medium ${summary.publicRecords > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.publicRecords}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-0.5">
            <span className="text-xs text-gray-600">Inquiries(2 Years):</span>
            <span className={`text-sm font-medium ${summary.inquiries2Years > 5 ? 'text-red-600' : summary.inquiries2Years > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
              {summary.inquiries2Years}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="flex items-end justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Credit Summary</h2>
        </div>
        <p className="text-xs text-gray-500 mb-1 hidden md:block">An overview of present and past credit status including open and closed accounts and balance information.</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showFullSummary ? (
              <>
                <FullBureauColumn 
                  title="TransUnion" 
                  summary={transUnionSummary} 
                  logoColor="text-cyan-700"
                />
                <FullBureauColumn 
                  title="Equifax" 
                  summary={equifaxSummary} 
                  logoColor="text-red-700"
                />
                <FullBureauColumn 
                  title="Experian" 
                  summary={experianSummary} 
                  logoColor="text-blue-700"
                />
              </>
            ) : (
              <>
                <MinimalBureauColumn 
                  title="TransUnion" 
                  summary={transUnionSummary} 
                  logoColor="text-cyan-700"
                />
                <MinimalBureauColumn 
                  title="Equifax" 
                  summary={equifaxSummary} 
                  logoColor="text-red-700"
                />
                <MinimalBureauColumn 
                  title="Experian" 
                  summary={experianSummary} 
                  logoColor="text-blue-700"
                />
              </>
            )}
          </div>
          
          {/* Show More / Show Less Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                const newShowFullSummary = !showFullSummary;
                setShowFullSummary(newShowFullSummary);
                
                // When collapsing (Show Less), scroll back to section start for both mobile and desktop
                if (!newShowFullSummary) {
                  setTimeout(() => {
                    const creditSummarySection = document.querySelector('[data-section="credit-summary"]');
                    if (creditSummarySection) {
                      const rect = creditSummarySection.getBoundingClientRect();
                      const offsetTop = window.pageYOffset + rect.top - 80;
                      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    }
                  }, 100);
                }
              }}
              className="flex items-center justify-center gap-2 w-full text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
            >
              <span>{showFullSummary ? 'Show Less' : 'Show More'}</span>
              {showFullSummary ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}