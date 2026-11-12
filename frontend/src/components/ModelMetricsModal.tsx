"use client";

import React, { useState, useEffect } from "react";
import { X, BarChart3, RefreshCw, ShieldAlert, Award, Layers } from "lucide-react";
import { api } from "@/lib/api";

interface ModelMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelMetricsModal: React.FC<ModelMetricsModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.getModelMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await api.retrainModel();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetraining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/30 text-indigo-100 border border-indigo-400/40">
                Machine Learning Evaluation
              </span>
              <span className="text-xs text-indigo-200">PS3 Retention Classifier</span>
            </div>
            <h3 className="text-lg font-bold mt-1">Random Forest Model Performance &amp; Confusion Matrix</h3>
            <p className="text-xs text-slate-300">
              Evaluated on stratified held-out test cohort
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p>Loading model evaluation artifacts...</p>
            </div>
          ) : metrics ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Precision</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{metrics.precision}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Recall</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{metrics.recall}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500">F1-Score</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{metrics.f1_score}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500">ROC-AUC</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.roc_auc}</p>
                </div>
              </div>

              {/* Class Distribution & Cohort Size */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Training / Test Partition: </span>
                  <span className="text-slate-600">{metrics.training_samples} training / {metrics.test_samples} test samples (75/25 split)</span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span>Retained: {metrics.class_distribution?.retained_count} • At-Risk: {metrics.class_distribution?.dropout_count}</span>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Confusion Matrix (Held-out Test Cohort)</h4>
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-[10px] uppercase font-bold text-emerald-800">True Negative (Retained)</p>
                      <p className="text-xl font-black text-emerald-700 mt-1">
                        {metrics.confusion_matrix?.[0]?.[0]}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                      <p className="text-[10px] uppercase font-bold text-rose-800">False Positive (False Alarm)</p>
                      <p className="text-xl font-black text-rose-700 mt-1">
                        {metrics.confusion_matrix?.[0]?.[1]}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-[10px] uppercase font-bold text-amber-800">False Negative (Missed)</p>
                      <p className="text-xl font-black text-amber-700 mt-1">
                        {metrics.confusion_matrix?.[1]?.[0]}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-[10px] uppercase font-bold text-indigo-800">True Positive (Caught Risk)</p>
                      <p className="text-xl font-black text-indigo-700 mt-1">
                        {metrics.confusion_matrix?.[1]?.[1]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Importances */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Gini Feature Importances (Random Forest)</h4>
                <div className="space-y-1.5">
                  {Object.entries(metrics.feature_importances || {}).map(([feat, imp]: [string, any]) => (
                    <div key={feat} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="font-medium text-slate-700">{feat}</span>
                      <span className="font-mono font-bold text-slate-900">{Math.round(imp * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthetic Data Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{metrics.dataset_note} Predictive indicators provide advisory signals for human counselor review; they do not claim causality.</span>
              </div>
            </>
          ) : (
            <p className="text-slate-500 py-6 text-center">No metrics available.</p>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retraining ? "animate-spin text-indigo-600" : ""}`} />
              {retraining ? "Retraining Pipeline..." : "Retrain Model Pipeline"}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

