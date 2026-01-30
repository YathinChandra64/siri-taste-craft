import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UpiInstructionsProps {
  onClose?: () => void;
}

const UPIInstructions = ({ onClose }: UpiInstructionsProps) => {
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>("where-to-find");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">UPI Payment Instructions</h2>
        <p className="text-slate-400">Learn where to find your UTR in the payment receipt</p>
      </motion.div>

      {/* Visual Guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            What is UTR?
          </h3>
          <p className="text-slate-300 mb-4">
            UTR (Unique Transaction Reference) is a 16-character alphanumeric code that uniquely identifies your UPI payment. It's also known as:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-slate-300">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Transaction ID</strong> - Some apps label it this way</span>
            </li>
            <li className="flex items-start gap-2 text-slate-300">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Ref No</strong> or <strong>Reference Number</strong> - Common in transaction details</span>
            </li>
            <li className="flex items-start gap-2 text-slate-300">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>TXN ID</strong> - Abbreviated form used by some payment apps</span>
            </li>
          </ul>
        </Card>
      </motion.div>

      {/* Payment Apps Guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Where to Find UTR by App
          </h3>
          
          <div className="space-y-4">
            {/* Google Pay */}
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Google Pay</h4>
              <ol className="text-slate-300 text-sm space-y-1">
                <li>1. After successful payment, look for the green checkmark</li>
                <li>2. Scroll down to "Transaction Details"</li>
                <li>3. Find the 16-character code next to "Ref No" or "UTR"</li>
              </ol>
            </div>

            {/* PhonePe */}
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">PhonePe</h4>
              <ol className="text-slate-300 text-sm space-y-1">
                <li>1. Tap on the successful transaction in your history</li>
                <li>2. Look for "Transaction ID" or "TXN ID"</li>
                <li>3. This is your 16-character UTR code</li>
              </ol>
            </div>

            {/* Paytm */}
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Paytm</h4>
              <ol className="text-slate-300 text-sm space-y-1">
                <li>1. Open "Passbook" after making payment</li>
                <li>2. Click on the recent transaction</li>
                <li>3. Find "Reference Number" - this is your UTR</li>
              </ol>
            </div>

            {/* WhatsApp Pay */}
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">WhatsApp / Airtel Pay</h4>
              <ol className="text-slate-300 text-sm space-y-1">
                <li>1. View transaction receipt immediately after payment</li>
                <li>2. Look for "UPI Ref No" or similar label</li>
                <li>3. Copy the entire 16-character code</li>
              </ol>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Example Receipt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Example Receipt</h3>
          
          <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm space-y-2 border border-slate-600">
            <div className="text-slate-400">═════════════════════════════</div>
            <div className="text-green-600 font-bold">✓ Payment Successful</div>
            <div className="text-slate-300">═════════════════════════════</div>
            
            <div className="text-slate-400 pt-2">
              <div className="flex justify-between">
                <span>To:</span>
                <span className="text-slate-300">siri@upi</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="text-slate-300">₹5,000</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="text-slate-300">2:45 PM</span>
              </div>
            </div>

            <div className="text-slate-400 border-t border-slate-600 pt-2">
              <div className="text-slate-300 font-bold">↓ LOOK FOR THIS ↓</div>
              <div className="flex justify-between py-2 bg-slate-800/50 px-2 rounded mt-1">
                <span>Ref No / UTR:</span>
                <span className="text-purple-400 font-bold">320524N00124567</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                (This is what we need from your screenshot)
              </div>
            </div>

            <div className="text-slate-400 border-t border-slate-600 pt-2">
              <div>Transaction ID: 2024013012345678</div>
              <div>Status: Success</div>
            </div>

            <div className="text-slate-400">═════════════════════════════</div>
          </div>
        </Card>
      </motion.div>

      {/* Important Notes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-yellow-950/30 border-yellow-700/50 p-6">
          <h3 className="text-lg font-semibold text-yellow-600 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Important Notes
          </h3>
          
          <div className="space-y-3 text-sm text-yellow-50">
            <div className="flex gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Always take a screenshot immediately after successful payment</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>Ensure the UTR/Reference number is clearly visible in your screenshot</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>The screenshot must show the payment status as "Success" or "Completed"</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>One UTR can only be used once - don't submit the same UTR multiple times</span>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-600 font-bold">•</span>
              <span>You have 3 attempts to submit a correct screenshot. After that, contact support</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Checklist Before Upload</h3>
          
          <div className="space-y-3">
            {[
              "Screenshot shows 'Success' or 'Completed' status",
              "UTR/Reference number is clearly visible",
              "The amount matches your order total",
              "The receiver is 'siri@upi' or Siri Taste Craft",
              "The timestamp is recent and accurate",
              "The screenshot is not blurry or partially cut off"
            ].map((item, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-purple-600"
                  disabled
                />
                <span className="text-slate-300 text-sm">{item}</span>
              </label>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Help Text */}
      <Card className="bg-blue-950/30 border-blue-700/50 p-4">
        <p className="text-blue-200 text-sm text-center">
          💡 If you're having trouble finding your UTR, take a screenshot of the success screen and our team will help you identify it.
        </p>
      </Card>
    </div>
  );
};

export default UPIInstructions;