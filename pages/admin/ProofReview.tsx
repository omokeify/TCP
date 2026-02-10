import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockService } from '../../services/mockDb';
import { Application, ClassConfig, DEFAULT_CLASS_INFO, LearningChallenge } from '../../types';

interface ProofItem {
    appId: string;
    appName: string;
    appEmail: string;
    challengeId: string;
    challengeTitle: string;
    proofContent: string;
    proofType: string;
    xp: number;
}

interface StudentGroup {
    appId: string;
    appName: string;
    appEmail: string;
    totalXp: number;
    proofs: ProofItem[];
}

export const ProofReview: React.FC = () => {
    const navigate = useNavigate();
    const [apps, setApps] = useState<Application[]>([]);
    const [config, setConfig] = useState<ClassConfig>(DEFAULT_CLASS_INFO);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<StudentGroup | null>(null);

    useEffect(() => {
        if (!MockService.isAdminAuthenticated()) {
            navigate('/admin/login');
            return;
        }
        loadData();
    }, [navigate]);

    const loadData = async () => {
        const [loadedApps, loadedConfig] = await Promise.all([
            MockService.getApplications(),
            MockService.getClassConfig()
        ]);
        setApps(loadedApps);
        setConfig(loadedConfig);
        setLoading(false);
    };

    const handleApprove = async (item: ProofItem) => {
        const app = apps.find(a => a.id === item.appId);
        if (!app) return;

        const newStatuses = { ...(app.proofStatuses || {}), [item.challengeId]: 'approved' as const };
        
        // Update local state first
        const updatedApps = apps.map(a => a.id === item.appId ? { ...a, proofStatuses: newStatuses } : a);
        setApps(updatedApps);

        // Update selected student view if open
        if (selectedStudent && selectedStudent.appId === item.appId) {
            setSelectedStudent(prev => prev ? ({
                ...prev,
                proofs: prev.proofs.filter(p => p.challengeId !== item.challengeId)
            }) : null);
        }

        // Save to DB
        await MockService.updateApplication(app.id, { proofStatuses: newStatuses });
    };

    const handleReject = async (item: ProofItem) => {
        if (!window.confirm("Reject this proof? The student will need to resubmit.")) return;
        
        const app = apps.find(a => a.id === item.appId);
        if (!app) return;

        // Remove proof content so they can resubmit
        const newTaskProofs = { ...(app.taskProofs || {}) };
        delete newTaskProofs[item.challengeId];
        
        // Also remove status if it exists (so it's not 'rejected' forever, just gone)
        const newStatuses = { ...(app.proofStatuses || {}) };
        delete newStatuses[item.challengeId];

        // Update local state
        const updatedApps = apps.map(a => a.id === item.appId ? { ...a, taskProofs: newTaskProofs, proofStatuses: newStatuses } : a);
        setApps(updatedApps);

        // Update selected student view if open
        if (selectedStudent && selectedStudent.appId === item.appId) {
            setSelectedStudent(prev => prev ? ({
                ...prev,
                proofs: prev.proofs.filter(p => p.challengeId !== item.challengeId)
            }) : null);
        }

        // Save to DB
        await MockService.updateApplication(app.id, { taskProofs: newTaskProofs, proofStatuses: newStatuses });
    };

    // Helper to find challenge details
    const findChallenge = (id: string): LearningChallenge | null => {
        // Check global modules
        for (const module of (config.modules || [])) {
            const found = module.challenges.find(c => c.id === id);
            if (found) return found;
        }
        // Check questSets
        for (const qs of (config.questSets || [])) {
            if (qs.modules) {
                for (const module of qs.modules) {
                    const found = module.challenges.find(c => c.id === id);
                    if (found) return found;
                }
            }
        }
        return null;
    };

    // Aggregate proofs by student
    const studentGroups: StudentGroup[] = [];
    const studentMap = new Map<string, StudentGroup>();

    apps.forEach(app => {
        if (!app.taskProofs) return;
        Object.entries(app.taskProofs).forEach(([chalId, proof]) => {
            // Skip if already approved
            if (app.proofStatuses?.[chalId] === 'approved') return;

            const challenge = findChallenge(chalId);
            const xp = challenge?.xp || 0;
            
            if (!studentMap.has(app.id)) {
                studentMap.set(app.id, {
                    appId: app.id,
                    appName: app.fullName || app.email,
                    appEmail: app.email,
                    totalXp: 0,
                    proofs: []
                });
            }

            const group = studentMap.get(app.id)!;
            group.proofs.push({
                appId: app.id,
                appName: app.fullName || app.email,
                appEmail: app.email,
                challengeId: chalId,
                challengeTitle: challenge?.title || 'Unknown Challenge',
                proofContent: proof,
                proofType: challenge?.proofType || 'text',
                xp
            });
            group.totalXp += xp;
        });
    });

    studentMap.forEach(group => {
        if (group.proofs.length > 0) {
            studentGroups.push(group);
        }
    });

    if (loading) return <div className="p-8 text-primary">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary dark:text-accent">Proof Review</h1>
                    <p className="text-ash dark:text-chalk/60 mt-1">Verify student submissions to award XP.</p>
                </div>
            </header>

            {/* Student Grid View */}
            {!selectedStudent && (
                <>
                    {studentGroups.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-ash/20 rounded-3xl">
                            <p className="text-xl font-bold text-ash/40">No pending proofs to review.</p>
                            <p className="text-sm text-ash/40 mt-2">Good job! You're all caught up.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {studentGroups.map((student) => (
                                <button 
                                    key={student.appId} 
                                    onClick={() => setSelectedStudent(student)}
                                    className="glass-card p-6 flex flex-col text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--primary)] font-bold text-xl">
                                            {student.appName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-primary dark:text-white leading-tight">{student.appName}</h3>
                                            <p className="text-xs text-ash dark:text-chalk/60">{student.appEmail}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex items-center justify-between w-full pt-4 border-t border-ash/10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-ash/60">Pending Tasks</span>
                                            <span className="text-2xl font-bold text-primary dark:text-white">{student.proofs.length}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase font-bold text-ash/60">Potential XP</span>
                                            <span className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--accent)]">+{student.totalXp}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 w-full py-2 bg-ash/5 rounded-lg text-center text-xs font-bold text-ash group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                                        Review Submissions
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Detailed Student View (Modal/Overlay) */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}></div>
                    <div className="relative w-full max-w-4xl max-h-full bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 md:p-8 border-b border-ash/10 flex items-center justify-between bg-white dark:bg-[#1a1a1a] z-10">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedStudent(null)} className="md:hidden mr-2">
                                    <span className="material-icons-outlined">arrow_back</span>
                                </button>
                                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--primary)] font-bold text-xl">
                                    {selectedStudent.appName.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-primary dark:text-white">{selectedStudent.appName}</h2>
                                    <p className="text-sm text-ash dark:text-chalk/60">Reviewing {selectedStudent.proofs.length} pending submissions</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedStudent(null)}
                                className="w-10 h-10 rounded-full bg-ash/10 flex items-center justify-center hover:bg-ash/20 transition-colors"
                            >
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-ash/5 dark:bg-black/20">
                            {selectedStudent.proofs.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="material-icons-outlined text-4xl text-green-500 mb-2">check_circle</span>
                                    <p className="font-bold text-primary dark:text-white">All caught up!</p>
                                    <p className="text-sm text-ash">No more pending proofs for this student.</p>
                                    <button onClick={() => setSelectedStudent(null)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold">Back to List</button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {selectedStudent.proofs.map((item) => (
                                        <div key={item.challengeId} className="bg-white dark:bg-[#2a2a2a] rounded-2xl p-6 shadow-sm border border-ash/10">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-ash/10 text-ash mb-2 tracking-wider">
                                                        {item.proofType} Proof
                                                    </span>
                                                    <h3 className="text-xl font-bold text-primary dark:text-white mb-1">{item.challengeTitle}</h3>
                                                    <p className="text-sm text-[var(--primary)] dark:text-[var(--accent)] font-bold">+{item.xp} XP</p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button 
                                                        onClick={() => handleReject(item)}
                                                        className="px-4 py-2 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 transition-colors text-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApprove(item)}
                                                        className="px-6 py-2 rounded-xl bg-[var(--eucalyptus)] text-[var(--primary)] font-bold hover:brightness-110 transition-all shadow-lg shadow-[var(--eucalyptus)]/20 text-sm flex items-center gap-2"
                                                    >
                                                        <span className="material-icons-outlined text-sm">check</span>
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="bg-ash/5 dark:bg-black/20 rounded-xl p-4 border border-ash/10 overflow-hidden">
                                                {item.proofType === 'image' || item.proofContent.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                    <a href={item.proofContent} target="_blank" rel="noreferrer" className="block relative group">
                                                        <img src={item.proofContent} alt="Proof" className="w-full max-h-96 object-contain rounded-lg bg-black/5" />
                                                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                            <span className="bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm">View Original</span>
                                                        </span>
                                                    </a>
                                                ) : item.proofContent.startsWith('http') ? (
                                                    <div className="flex items-center gap-3 p-2">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                            <span className="material-icons-outlined">link</span>
                                                        </div>
                                                        <a href={item.proofContent} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all font-medium">
                                                            {item.proofContent}
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="prose prose-sm max-w-none text-primary dark:text-chalk whitespace-pre-wrap">
                                                        {item.proofContent}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
