"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import Image from 'next/image';

export default function SharedResumePage() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const res = await fetch(`/api/candidates?id=${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch candidate');
        }
        const data = await res.json();
        setCandidate({
          ...data,
          jobApplied: data.job_applied,
          extractedData: data.extracted_data
        });
      } catch (err) {
        setError('Could not load candidate profile. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading candidate profile...</div>;
  }

  if (error || !candidate) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  const extractedData = candidate.extractedData || {};
  const skills = candidate.skills ? candidate.skills.join(', ') : '';
  const expTotal = extractedData?.totalExperienceAnalysis?.totalExperience || 'N/A';
  const expDomain = extractedData?.totalExperienceAnalysis?.domainExperience || '0';
  const expLeadership = extractedData?.totalExperienceAnalysis?.leadershipExperience || '0';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Print Hide Block */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Standardized Candidate Profile</h2>
          <p className="text-slate-500 text-sm">Read-only view • Contact details omitted for unbiased screening</p>
        </div>
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Printer size={18} /> Download PDF
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .shadow-xl { box-shadow: none !important; }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
        }
      `}} />

      {/* Main Resume Paper */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
        <div className="p-10 lg:p-12 text-slate-800">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 m-0 leading-tight">
                {candidate.name.toUpperCase()}
              </h1>
              <p className="text-xl font-semibold text-slate-500 mt-2">
                {candidate.jobApplied} Candidate
              </p>
            </div>
            <div>
              <Image 
                src="/kadellabs-logo.png" 
                alt="Kadel Labs" 
                width={150} 
                height={50} 
                className="object-contain h-12 w-auto" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            
            {/* Left Column */}
            <div className="md:col-span-5 flex flex-col gap-8">
              
              <section>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">
                  Experience Summary
                </h2>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Experience:</span>
                    <strong className="text-slate-900">{expTotal}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain Experience:</span>
                    <strong className="text-slate-900">{expDomain} years</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Leadership:</span>
                    <strong className="text-slate-900">{expLeadership} years</strong>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">
                  Core Competencies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.split(',').filter(Boolean).map((skill: string, i: number) => (
                    <span key={i} className="bg-blue-50 text-blue-900 px-3 py-1.5 rounded-md text-xs font-medium border border-blue-100">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </section>

            </div>

            {/* Right Column */}
            <div className="md:col-span-7 flex flex-col gap-8">
              
              <section>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">
                  Project Highlights
                </h2>
                <div className="flex flex-col gap-6">
                  {extractedData?.projectAnalysis && extractedData.projectAnalysis.length > 0 ? (
                    extractedData.projectAnalysis.map((proj: any, i: number) => (
                      <div key={i}>
                        <h4 className="font-bold text-base text-slate-900 mb-1">
                          {proj.projectName || 'Unnamed Project'}
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed m-0">
                          {proj.projectDescription || 'No description provided.'}
                        </p>
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="mt-2 text-xs text-slate-500">
                            <strong>Technologies: </strong> {proj.techStack.join(', ')}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="italic text-slate-400 text-sm">No project history available.</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">
                  Education
                </h2>
                <div className="flex flex-col gap-4">
                  {extractedData?.educationDetails && extractedData.educationDetails.length > 0 ? (
                    extractedData.educationDetails.map((edu: any, i: number) => (
                      <div key={i}>
                        <h4 className="font-bold text-sm text-slate-900 m-0">
                          {edu.degree || 'Degree details N/A'}
                        </h4>
                        <div className="text-sm text-slate-600 mt-1">
                          {edu.college || 'Institution N/A'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {edu.passingYear && `Class of ${edu.passingYear}`} {edu.cgpaOrPercentage && `| ${edu.cgpaOrPercentage}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-slate-400 text-sm">No education records available.</p>
                  )}
                </div>
              </section>

            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-xs">
            This resume was automatically generated and standardized via Kadel Labs Interview Platform. <br/>
            Contact details have been omitted for unbiased screening.
          </div>

        </div>
      </div>
    </div>
  );
}
