import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Truck,
  Home,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface TimelineStage {
  name: string;
  status: "completed" | "pending" | "current";
  timestamp?: Date;
  icon: string;
  description?: string;
  shipper?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  location?: string;
}

interface OrderTrackingProps {
  orderId: string;
  currentStatus: string;
  stages: TimelineStage[];
  shipping?: {
    shipper?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDeliveryDate?: string;
  };
  timeline?: Array<{
    status: string;
    description: string;
    timestamp: string;
    location?: string;
    shipper?: string;
    trackingNumber?: string;
  }>;
}

const OrderTrackingTimeline: React.FC<OrderTrackingProps> = ({
  orderId,
  currentStatus,
  stages,
  shipping,
  timeline = [],
}) => {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const getStageIcon = (stage: TimelineStage) => {
    switch (stage.name) {
      case "Order Placed":
        return <Package className="w-6 h-6" />;
      case "Confirmed":
      case "Packed":
        return <CheckCircle2 className="w-6 h-6" />;
      case "Shipped":
      case "Out for Delivery":
        return <Truck className="w-6 h-6" />;
      case "Delivered":
        return <Home className="w-6 h-6" />;
      default:
        return <Clock className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "text-emerald-500 bg-emerald-500/10",
      current: "text-blue-500 bg-blue-500/10",
      pending: "text-slate-400 bg-slate-400/10",
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "In Progress";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString.toString();
    }
  };

  const completedStages = stages.filter((s) => s.status === "completed").length;
  const progress = ((completedStages + 1) / stages.length) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Order Progress</h3>
            <p className="text-sm text-slate-400">
              {completedStages} of {stages.length} stages completed
            </p>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400">
            {currentStatus.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line connector */}
        <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gradient-to-b from-purple-600 to-slate-600" />

        {/* Timeline stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isCompleted = stage.status === "completed";
            const isCurrent = stage.status === "current";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative bg-slate-800 border-slate-700 cursor-pointer hover:border-purple-600/50 transition-all ${
                    isCurrent ? "border-purple-500" : ""
                  }`}
                  onClick={() =>
                    setExpandedStage(expandedStage === index ? null : index)
                  }
                >
                  <div className="p-4">
                    {/* Timeline node */}
                    <div className="absolute left-0 top-6 -translate-x-1/2 translate-y-0.5">
                      <motion.div
                        className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${getStatusColor(
                          stage.status
                        )} border-4 border-slate-800 bg-slate-900`}
                        animate={{
                          scale: isCurrent ? 1.2 : 1,
                        }}
                        transition={{
                          duration: 0.3,
                        }}
                      >
                        {stage.icon}
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="ml-24">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-white font-bold text-lg">
                            {stage.name}
                          </h4>
                          {isCurrent && (
                            <Badge className="bg-blue-500/20 text-blue-400 animate-pulse">
                              In Progress
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge className="bg-emerald-500/20 text-emerald-400">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-slate-400">
                          {formatDate(stage.timestamp)}
                        </span>
                      </div>

                      {stage.description && (
                        <p className="text-sm text-slate-400 mb-3">
                          {stage.description}
                        </p>
                      )}

                      {/* Tracking info preview */}
                      {(stage.shipper || stage.location) && (
                        <div className="flex gap-4 text-sm text-slate-400">
                          {stage.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-purple-400" />
                              {stage.location}
                            </div>
                          )}
                          {stage.shipper && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-4 h-4 text-blue-400" />
                              {stage.shipper}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expanded details */}
                      {expandedStage === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-700 space-y-3"
                        >
                          {stage.shipper && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-slate-400 text-xs mb-1">
                                  COURIER
                                </p>
                                <p className="text-white font-semibold">
                                  {stage.shipper}
                                </p>
                              </div>
                              {stage.trackingNumber && (
                                <div>
                                  <p className="text-slate-400 text-xs mb-1">
                                    TRACKING NUMBER
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-mono text-sm">
                                      {stage.trackingNumber}
                                    </p>
                                    {stage.trackingUrl && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="p-0 h-auto"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(stage.trackingUrl, "_blank");
                                        }}
                                      >
                                        <ExternalLink className="w-4 h-4 text-purple-400" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {stage.location && (
                            <div>
                              <p className="text-slate-400 text-xs mb-1">
                                LOCATION
                              </p>
                              <p className="text-white">{stage.location}</p>
                            </div>
                          )}

                          {!stage.shipper && !stage.trackingNumber && (
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Clock className="w-4 h-4" />
                              Awaiting next update...
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Shipping info card */}
      {shipping && (shipping.shipper || shipping.estimatedDeliveryDate) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-4">
            <div className="flex items-start gap-4">
              <Truck className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">
                  Shipping Information
                </h4>
                <div className="space-y-2 text-sm">
                  {shipping.shipper && (
                    <div>
                      <p className="text-slate-400">Courier Service</p>
                      <p className="text-white">{shipping.shipper}</p>
                    </div>
                  )}
                  {shipping.trackingNumber && (
                    <div>
                      <p className="text-slate-400">Tracking Number</p>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono">
                          {shipping.trackingNumber}
                        </p>
                        {shipping.trackingUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-0 h-auto"
                            onClick={() => window.open(shipping.trackingUrl, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 text-purple-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {shipping.estimatedDeliveryDate && (
                    <div>
                      <p className="text-slate-400">Estimated Delivery</p>
                      <p className="text-white">
                        {formatDate(shipping.estimatedDeliveryDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent timeline entries */}
      {timeline && timeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-800 border-slate-700 p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Timeline History
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {timeline.map((entry, idx) => (
                <div
                  key={idx}
                  className="text-sm bg-slate-700/30 p-3 rounded border border-slate-700/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {entry.status.replace(/_/g, " ")}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        {entry.description}
                      </p>
                      {entry.location && (
                        <p className="text-slate-500 text-xs mt-1">
                          📍 {entry.location}
                        </p>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs flex-shrink-0">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Help message */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-400">
          <p className="font-medium text-white mb-1">Tracking Information</p>
          <p>
            Your order status is updated in real-time. Click on any stage for more details
            including location and tracking information. You can also click on the tracking
            number to view updates from the courier service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingTimeline;