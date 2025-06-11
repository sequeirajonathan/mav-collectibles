'use client'

import { useState, useEffect } from 'react';
import { PrintJob, PrintCommand } from '@interfaces';
import { usePrintJobs } from '@hooks/usePrintJobs';
import { ChevronDown } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useClerk } from '@clerk/nextjs';

interface PrintAgentClientProps {
  agentId: string;
}

interface JobDetailsModalProps {
  job: PrintJob;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string | undefined) => {
  if (!status) return 'bg-gray-500 text-white';
  
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-500 text-black';
    case 'claimed':
      return 'bg-blue-500 text-white';
    case 'printing':
      return 'bg-purple-500 text-white';
    case 'completed':
      return 'bg-green-500 text-white';
    case 'failed':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const JobDetailsModal = ({ job, isOpen, onClose }: JobDetailsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-[#E6B325]/30 rounded-lg p-4 sm:p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-[#E6B325]">Print Job Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-[#E6B325] transition-colors p-2"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 sm:space-y-4 text-white text-sm sm:text-base">
          <div key="order-id">
            <span className="text-[#E6B325]">Order ID:</span> {job.order_id}
          </div>
          <div key="status">
            <span className="text-[#E6B325]">Status:</span>{' '}
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
          </div>
          <div key="created">
            <span className="text-[#E6B325]">Created:</span>{' '}
            {new Date(job.created_at).toLocaleString()}
          </div>
          {job.claimed_by && (
            <div key="claimed-by">
              <span className="text-[#E6B325]">Claimed by:</span> {job.claimed_by}
            </div>
          )}
          {job.claimed_at && (
            <div key="claimed-at">
              <span className="text-[#E6B325]">Claimed at:</span>{' '}
              {new Date(job.claimed_at).toLocaleString()}
            </div>
          )}
          {job.printed_at && (
            <div key="printed-at">
              <span className="text-[#E6B325]">Printed at:</span>{' '}
              {new Date(job.printed_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function PrintAgentClient({ agentId }: PrintAgentClientProps) {
  const { isElectron } = useAppContext();
  const [message, setMessage] = useState('');
  const { printJobs, error, isLoading } = usePrintJobs();
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const { signOut } = useClerk();

  useEffect(() => {
    if (isElectron) {
      window.electron?.onPrintResponse((event, response) => {
        setMessage(response.message);
      });
      window.electron?.onPrintJobUpdate((event, payload) => {
        console.log('Print job update:', payload);
      });

      // Add sign out listener
      const handleSignOut = async () => {
        console.log('🔐 PrintAgentClient - Received electron-sign-out signal');
        try {
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('🔐 PrintAgentClient - Starting sign out process');
          }
          await signOut();
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
            console.log('🔐 PrintAgentClient - Sign out completed successfully');
          }
        } catch (error) {
          console.error('🔐 PrintAgentClient - Sign out error:', error);
        }
      };

      console.log('🔐 PrintAgentClient - Setting up electron-sign-out listener');
      window.electron?.onSignOut(handleSignOut);

      return () => {
        console.log('🔐 PrintAgentClient - Cleaning up electron-sign-out listener');
        window.electron?.removeListener?.('electron-sign-out', handleSignOut);
      };
    }
  }, [isElectron, signOut]);

  if (!agentId) {
    return <div className="text-white text-center py-8">Loading agent info...</div>;
  }

  const jobs = Array.isArray(printJobs) ? printJobs : (printJobs ? [printJobs] : []);

  const handlePrint = async (jobId: string) => {
    try {
      if (!window.electron) {
        throw new Error('Not running in Electron');
      }

      const job = jobs.find(j => j.id === jobId);
      const command: PrintCommand = {
        type: 'PRINT',
        orderId: jobId,
        settings: {
          printerName: job?.printer_name || '',
          labelUrl: job?.label_url,
          silent: true,
        }
      };

      window.electron.sendPrintCommand(command);
      setMessage('Print command sent to Electron app');
    } catch (error) {
      setMessage('Failed to send print command');
      console.error('Print command error:', error);
    }
  };

  const handleTestPrint = async () => {
    try {
      if (!window.electron) {
        throw new Error('Not running in Electron');
      }
      const testLabelUrl = 'https://rollo-main.b-cdn.net/wp-content/uploads/2017/01/Labels-Sample.pdf';
      const command: PrintCommand = {
        type: 'PRINT',
        orderId: 'TEST-PRINT',
        settings: {
          labelUrl: testLabelUrl,
          silent: true,
        },
      };
      window.electron.sendPrintCommand(command);
      setMessage('Test print command sent to Electron app');
    } catch (error) {
      setMessage('Failed to send test print command');
      console.error('Test print command error:', error);
    }
  };

  const formatOrderId = (orderId: string | undefined) => {
    if (!orderId) return 'N/A';
    if (orderId.length <= 10) return orderId;
    return `${orderId.substring(0, 10)}...`;
  };

  if (isLoading) {
    return <div className="text-white text-center py-4">Loading print jobs...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error loading print jobs</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <div className="bg-black border border-[#E6B325]/30 rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E6B325] mb-4 sm:mb-6 text-center">Print Agent</h1>
        <div className="space-y-4 sm:space-y-6">
          {/* Test Print Button */}
          <div className="flex justify-end">
            <button
              type="button"
              className="px-3 py-1 bg-[#E6B325] hover:bg-[#FFD966] text-black rounded-md transition-colors"
              onClick={handleTestPrint}
            >
              Test Print
            </button>
          </div>

          {/* Connection Status Section */}
          <div className="border border-[#E6B325]/30 rounded-lg p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-semibold text-[#E6B325] mb-3 sm:mb-4">Connection Status</h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isElectron ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-white text-sm sm:text-base">
                  {isElectron ? 'Connected to Electron' : 'Disconnected'}
                </span>
              </div>
              {message && (
                <div className="text-[#E6B325] mt-2 text-sm sm:text-base">
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Print Jobs Section */}
          <div className="border border-[#E6B325]/30 rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-[#E6B325]">Print Jobs</h2>
              {jobs.length > 0 && (
                <button
                  onClick={() => {
                    const table = document.getElementById('print-jobs-table');
                    if (table) {
                      table.scrollTo({ top: table.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-[#E6B325] hover:bg-[#FFD966] text-black rounded-md transition-colors text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Latest Jobs
                </button>
              )}
            </div>
            <div className="space-y-3">
              {jobs.length === 0 ? (
                <div className="text-white text-center py-6 border border-[#E6B325]/30 rounded-lg">
                  <p className="text-lg text-[#E6B325]/70">No print jobs available</p>
                  <p className="text-sm text-white/70 mt-2">New print jobs will appear here when they are created</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div id="print-jobs-table" className="max-h-[calc(100vh-300px)] overflow-y-auto">
                    <table className="w-full divide-y divide-[#E6B325]/30">
                      <thead className="sticky top-0 bg-black">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-[#E6B325] text-sm w-1/4">Order ID</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-[#E6B325] text-sm w-1/4">Status</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-[#E6B325] text-sm w-1/4">Created</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-[#E6B325] text-sm w-1/4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((job: PrintJob) => (
                          <tr key={job.id} className="text-white text-sm hover:bg-[#E6B325]/5 transition-colors">
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="text-white hover:text-[#E6B325] transition-colors"
                              >
                                {formatOrderId(job.order_id)}
                              </button>
                            </td>
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                              {new Date(job.created_at).toLocaleString()}
                            </td>
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {job.status === 'pending' && (
                                  <button
                                    onClick={() => handlePrint(job.id)}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                  >
                                    Print
                                  </button>
                                )}
                                {job.status === 'claimed' && job.claimed_by === agentId && (
                                  <button
                                    onClick={() => handlePrint(job.id)}
                                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                  >
                                    Print
                                  </button>
                                )}
                                {job.status === 'claimed' && job.claimed_by === agentId && (
                                  <button
                                    onClick={() => handlePrint(job.id)}
                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  >
                                    Unclaim
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          key={`modal-${selectedJob.id}`}
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-black border border-red-500 rounded text-red-400 text-xs">
          <div><b>Debug Info</b></div>
          <div>agentId: {String(agentId)}</div>
          <div>isElectron: {String(isElectron)}</div>
        </div>
      )}
    </div>
  );
} 