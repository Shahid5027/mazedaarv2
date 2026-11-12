"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/ps3/upload-csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        onUploadSuccess();
      } else {
        setError(data.message || "Failed to process CSV");
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred");
    } finally {
      setUploading(false);
    }
  };

  const sampleCsvContent = `student_id,attendance_rate,average_grade,late_assignments,missing_assignments,lms_logins_30d,engagement_change_pct,previous_failure_count,name,department
STU011,85.5,78.0,1,0,24,3.0,0,Karan Johar,Computer Science
STU012,62.0,58.0,3,2,6,-18.0,1,Rhea Kapoor,Artificial Intelligence
STU013,94.0,91.5,0,0,32,8.0,0,Amitabh Ghosh,Data Science`;

  const downloadSample = () => {
    const blob = new Blob([sampleCsvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_students_ingest.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-amber-600 to-orange-700 text-white flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-amber-500/30 text-amber-100 border border-amber-400/40">
              PS3 Batch Data Ingestion
            </span>
            <h3 className="text-lg font-bold mt-1">Upload Student Academic CSV</h3>
            <p className="text-xs text-amber-100">
              Batch update attendance, CGPA, and retention risk indicators
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {result ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Batch Ingestion Results</h4>
                <div className="flex items-center justify-center gap-4 text-xs pt-1">
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Accepted: {result.accepted_count} rows
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    result.rejected_count > 0 ? "text-rose-700 bg-rose-100" : "text-slate-500 bg-slate-100"
                  }`}>
                    Rejected: {result.rejected_count} rows
                  </span>
                </div>
              </div>

              {result.rejected_rows && result.rejected_rows.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-left space-y-2 max-h-40 overflow-y-auto">
                  <p className="font-bold text-rose-900 text-[11px]">Validation Rejection Diagnostics:</p>
                  <ul className="space-y-1 text-[11px] text-rose-800">
                    {result.rejected_rows.map((r: any, idx: number) => (
                      <li key={idx} className="border-b border-rose-100 pb-1">
                        Row {r.row_number} ({r.student_id}): {r.reasons.join("; ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition"
              >
                Done and Refresh View
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2">
                <UploadCloud className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="font-semibold text-slate-700">Choose CSV File from Disk</p>
                <p className="text-[11px] text-slate-500">
                  Must include columns: student_id, name, department, attendance_pct, cgpa
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 text-slate-800 font-medium">
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-slate-500 text-[10px]">({Math.round(file.size / 1024)} KB)</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={downloadSample}
                  className="text-amber-700 hover:text-amber-800 font-bold underline"
                >
                  Download Sample CSV Template
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className={`px-5 py-2 rounded-lg font-bold text-white transition shadow-md ${
                    file && !uploading
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                      : "bg-slate-300 cursor-not-allowed text-slate-500"
                  }`}
                >
                  {uploading ? "Ingesting..." : "Ingest CSV Data"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

