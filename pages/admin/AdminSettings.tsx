import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockService } from '../../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO, TaskConfig, ClassResource, QuestSet, ClassSession, LearningModule, LearningChallenge } from '../../types';

export const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ClassConfig>(DEFAULT_CLASS_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbUrl, setDbUrl] = useState('');

  useEffect(() => {
    if (!MockService.isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    const load = async () => {
      const data = await MockService.getClassConfig();
      // Ensure resources array exists for older configs
      if (!data.resources) {
        data.resources = DEFAULT_CLASS_INFO.resources;
      }
      setConfig(data);
      setDbUrl(MockService.getDbUrl() || '');
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dbUrl !== MockService.getDbUrl()) {
         MockService.setDbUrl(dbUrl);
      }
      await MockService.updateClassConfig(config);
      alert("Settings saved successfully!");
    } catch (e) {
      alert("Failed to save settings. If using Google Sheets, check your script URL.");
    } finally {
      setSaving(false);
    }
  };

  const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);
  const [expandedQuestIndex, setExpandedQuestIndex] = useState<number | null>(null);

  // --- Task Management (Legacy - Removed) ---


  // --- Resource Management ---
  const handleResourceChange = (index: number, field: keyof ClassResource, value: any) => {
    const newResources = [...config.resources];
    newResources[index] = { ...newResources[index], [field]: value };
    setConfig({ ...config, resources: newResources });
  };

  const addResource = () => {
    const newResource: ClassResource = {
        id: Math.random().toString(36).substr(2, 9),
        title: "New Resource",
        description: "Description of the content",
        url: "https://",
        type: "link"
    };
    setConfig({ ...config, resources: [...config.resources, newResource] });
  };

  const removeResource = (index: number) => {
    const newResources = config.resources.filter((_, i) => i !== index);
    setConfig({ ...config, resources: newResources });
  };

  // --- Quest Set Management (Sessions) ---
  const handleQuestSetChange = (index: number, field: keyof QuestSet, value: any) => {
      const newQuestSets = [...(config.questSets || [])];
      newQuestSets[index] = { ...newQuestSets[index], [field]: value };
      setConfig({ ...config, questSets: newQuestSets });
  };

  const handleQuestTutorChange = (index: number, field: 'name' | 'avatarUrl', value: string) => {
      const newQuestSets = [...(config.questSets || [])];
      const currentTutor = newQuestSets[index].tutor || { name: '', avatarUrl: '' };
      newQuestSets[index] = { 
          ...newQuestSets[index], 
          tutor: { ...currentTutor, [field]: value } 
      };
      setConfig({ ...config, questSets: newQuestSets });
  };

  const addQuestSet = () => {
      const newQuestSet: QuestSet = {
          id: Math.random().toString(36).substr(2, 9),
          title: "New Session / Quest Set",
          description: "Description of the session content",
          category: "General",
          level: "Beginner",
          status: "draft",
          capacity: 50,
          instructor: "Fredy",
          sessions: [],
          tasks: [],
          tutor: { name: "Tutor", avatarUrl: "" }
      };
      const newQuestSets = [...(config.questSets || []), newQuestSet];
      setConfig({ ...config, questSets: newQuestSets });
      setExpandedQuestIndex(newQuestSets.length - 1);
  };

  const removeQuestSet = (index: number) => {
      const newQuestSets = [...(config.questSets || [])];
      newQuestSets.splice(index, 1);
      setConfig({ ...config, questSets: newQuestSets });
  };

  const addQuestTask = (questIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      const newTask: TaskConfig = {
          id: Math.random().toString(36).substr(2, 9),
          description: "New Task",
          requiresProof: true,
          proofType: "link"
      };
      newQuestSets[questIndex].tasks.push(newTask);
      setConfig({ ...config, questSets: newQuestSets });
  };

  const removeQuestTask = (questIndex: number, taskIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      newQuestSets[questIndex].tasks.splice(taskIndex, 1);
      setConfig({ ...config, questSets: newQuestSets });
  };

  const handleQuestTaskChange = (questIndex: number, taskIndex: number, field: keyof TaskConfig, value: any) => {
      const newQuestSets = [...(config.questSets || [])];
      newQuestSets[questIndex].tasks[taskIndex] = { 
          ...newQuestSets[questIndex].tasks[taskIndex], 
          [field]: value 
      };
      setConfig({ ...config, questSets: newQuestSets });
  };

  const handleQuestCustomFieldChange = (questIndex: number, field: string, value: string) => {
      const newQuestSets = [...(config.questSets || [])];
      const currentCustomFields = newQuestSets[questIndex].customFields || {};
      newQuestSets[questIndex] = { 
          ...newQuestSets[questIndex], 
          customFields: { ...currentCustomFields, [field]: value } 
      };
      setConfig({ ...config, questSets: newQuestSets });
  };

  const addQuestResource = (questIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      const newResource: ClassResource = {
          id: Math.random().toString(36).substr(2, 9),
          title: "New Resource",
          description: "Description of the content",
          url: "https://",
          type: "link"
      };
      if (!newQuestSets[questIndex].resources) {
          newQuestSets[questIndex].resources = [];
      }
      newQuestSets[questIndex].resources!.push(newResource);
      setConfig({ ...config, questSets: newQuestSets });
  };

  const removeQuestResource = (questIndex: number, resourceIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].resources) {
          newQuestSets[questIndex].resources!.splice(resourceIndex, 1);
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  const handleQuestResourceChange = (questIndex: number, resourceIndex: number, field: keyof ClassResource, value: any) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].resources && newQuestSets[questIndex].resources![resourceIndex]) {
          newQuestSets[questIndex].resources![resourceIndex] = {
              ...newQuestSets[questIndex].resources![resourceIndex],
              [field]: value
          };
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  const addQuestSession = (questIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      const newSession: ClassSession = {
          id: Math.random().toString(36).substr(2, 9),
          title: "Live Workshop",
          date: "October 15, 2030",
          time: "2:00 PM EST",
          location: "Google Meet",
          instructor: "Fredy"
      };
      newQuestSets[questIndex].sessions = [...(newQuestSets[questIndex].sessions || []), newSession];
      setConfig({ ...config, questSets: newQuestSets });
  };

  const removeQuestSession = (questIndex: number, sessionIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].sessions) {
          newQuestSets[questIndex].sessions!.splice(sessionIndex, 1);
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  const handleQuestSessionChange = (questIndex: number, sessionIndex: number, field: keyof ClassSession, value: any) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].sessions) {
          newQuestSets[questIndex].sessions![sessionIndex] = {
              ...newQuestSets[questIndex].sessions![sessionIndex],
              [field]: value
          };
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  // --- Quest Modules (Curriculum) Management ---
  const addQuestModule = (questIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      const newModule: any = { // using any temporarily to bypass strict check if types aren't fully reloaded
          id: Math.random().toString(36).substr(2, 9),
          title: "New Module",
          description: "Module description",
          order: (newQuestSets[questIndex].modules?.length || 0) + 1,
          resources: [],
          challenges: []
      };
      newQuestSets[questIndex].modules = [...(newQuestSets[questIndex].modules || []), newModule];
      setConfig({ ...config, questSets: newQuestSets });
  };

  const removeQuestModule = (questIndex: number, moduleIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].modules) {
          newQuestSets[questIndex].modules!.splice(moduleIndex, 1);
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  const handleQuestModuleChange = (questIndex: number, moduleIndex: number, field: string, value: any) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].modules) {
          newQuestSets[questIndex].modules![moduleIndex] = {
              ...newQuestSets[questIndex].modules![moduleIndex],
              [field]: value
          };
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  const addModuleChallenge = (questIndex: number, moduleIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      const newChallenge: LearningChallenge = {
          id: Math.random().toString(36).substr(2, 9),
          title: "New Challenge",
          description: "Describe the challenge",
          proofType: "link",
          xp: 100
      };
      if (newQuestSets[questIndex].modules && newQuestSets[questIndex].modules![moduleIndex]) {
         const module = newQuestSets[questIndex].modules![moduleIndex];
         module.challenges = [...(module.challenges || []), newChallenge];
         setConfig({ ...config, questSets: newQuestSets });
      }
  };

  const removeModuleChallenge = (questIndex: number, moduleIndex: number, challengeIndex: number) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].modules && newQuestSets[questIndex].modules![moduleIndex]) {
          newQuestSets[questIndex].modules![moduleIndex].challenges.splice(challengeIndex, 1);
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  const handleModuleChallengeChange = (questIndex: number, moduleIndex: number, challengeIndex: number, field: string, value: any) => {
      const newQuestSets = [...(config.questSets || [])];
      if (newQuestSets[questIndex].modules && newQuestSets[questIndex].modules![moduleIndex]) {
          const challenges = newQuestSets[questIndex].modules![moduleIndex].challenges;
          challenges[challengeIndex] = { ...challenges[challengeIndex], [field]: value };
          setConfig({ ...config, questSets: newQuestSets });
      }
  };

  if (loading) return <div className="p-8 text-primary">Loading settings...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header>
         <h1 className="text-3xl font-bold text-primary dark:text-accent">Class Settings</h1>
         <p className="text-ash dark:text-chalk/60 mt-1">Configure public page details, application requirements, and student resources.</p>
      </header>

      {/* Database Connection */}
      <div className="bg-[#FFFA7E]/20 border border-[#FFFA7E] p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold text-primary dark:text-accent mb-2">Google Sheets Database</h2>
        <p className="text-sm text-ash dark:text-chalk/60 mb-4">
            To use Google Sheets, deploy the Apps Script provided in the source code (`services/mockDb.ts`) and paste the Web App URL here.
            Leave empty to use local demo storage.
        </p>
        <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Apps Script Web App URL</label>
        <input 
            type="url" 
            className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
            value={dbUrl}
            onChange={(e) => setDbUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
        />
      </div>

       {/* Application Toggle */}
       <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10 flex items-center justify-between">
          <div>
              <h2 className="text-lg font-bold text-primary dark:text-white">Open Applications</h2>
              <p className="text-sm text-ash dark:text-chalk/60">
                  {config.acceptingApplications 
                    ? "Applications are open. Users can browse quests and submit applications via the Quests page." 
                    : "Applications are closed. The Quests page will show a closed message."}
              </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                className="sr-only peer"
                checked={!!config.acceptingApplications}
                onChange={(e) => setConfig({ ...config, acceptingApplications: e.target.checked })}
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
          </label>
       </div>

      {/* Quest Sets (Sessions) Config */}
      <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-primary dark:text-white">Quest Sets (Sessions)</h2>
            <button 
                onClick={addQuestSet}
                className="px-3 py-1.5 bg-accent/20 text-primary dark:text-accent rounded-lg text-sm font-bold hover:bg-accent hover:text-primary transition-colors flex items-center gap-1"
            >
                <span className="material-icons-outlined text-sm">add</span> Create Quest
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.questSets?.map((quest, qIndex) => {
                const isExpanded = expandedQuestIndex === qIndex;
                
                if (isExpanded) {
                    return (
                        <div key={quest.id || qIndex} className="col-span-1 md:col-span-2 lg:col-span-3 p-6 rounded-xl border-2 border-primary/20 bg-chalk/10 dark:bg-white/5 shadow-xl relative animate-fadeIn">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedQuestIndex(null); }}
                                className="absolute top-4 right-4 p-2 bg-white dark:bg-black/20 rounded-full hover:bg-ash/10 transition-colors z-10"
                                title="Close Editor"
                             >
                                <span className="material-icons-outlined">close</span>
                             </button>

                            {/* Header with Title, Status, and Delete */}
                            <div className="flex justify-between items-start mb-6 border-b border-ash/10 pb-6 pr-12">
                                <div className="flex-1 mr-4 grid gap-4">
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Quest Title</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg font-bold text-lg focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                            value={quest.title}
                                            onChange={(e) => handleQuestSetChange(qIndex, 'title', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="w-1/3 min-w-[150px]">
                                             <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Status</label>
                                             <select 
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                                value={quest.status || 'draft'}
                                                onChange={(e) => handleQuestSetChange(qIndex, 'status', e.target.value)}
                                             >
                                                <option value="draft">Draft</option>
                                                <option value="active">Active</option>
                                                <option value="completed">Completed</option>
                                             </select>
                                        </div>
                                        <div className="w-1/4 min-w-[100px]">
                                             <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Capacity</label>
                                             <input 
                                                type="number" 
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                                value={quest.capacity || 0}
                                                onChange={(e) => handleQuestSetChange(qIndex, 'capacity', parseInt(e.target.value) || 0)}
                                             />
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                             <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Instructor</label>
                                             <input 
                                                type="text" 
                                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                                value={quest.instructor || ''}
                                                onChange={(e) => handleQuestSetChange(qIndex, 'instructor', e.target.value)}
                                                placeholder="Class Host Name"
                                             />
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this quest?')) {
                                            removeQuestSet(qIndex);
                                            setExpandedQuestIndex(null);
                                        }
                                    }}
                                    className="p-2 text-ash/40 hover:text-red-500 dark:text-chalk/20 dark:hover:text-red-400 transition-colors bg-white dark:bg-white/5 rounded-lg border border-chalk dark:border-white/10"
                                    title="Delete Quest"
                                >
                                    <span className="material-icons-outlined">delete_outline</span>
                                </button>
                            </div>

                            {/* Quest Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="md:col-span-2">
                                     <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Description</label>
                                     <textarea 
                                        rows={2}
                                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk resize-none"
                                        value={quest.description}
                                        onChange={(e) => handleQuestSetChange(qIndex, 'description', e.target.value)}
                                     />
                                </div>
                                <div className="md:col-span-2">
                                     <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Extra Notes (Portal Only)</label>
                                     <textarea 
                                        rows={2}
                                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk resize-none"
                                        value={quest.extraNotes || ''}
                                        onChange={(e) => handleQuestSetChange(qIndex, 'extraNotes', e.target.value)}
                                        placeholder="Additional info visible only to accepted students."
                                     />
                                </div>
                                <div>
                                     <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Category</label>
                                     <input 
                                        type="text" 
                                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                        value={quest.category}
                                        onChange={(e) => handleQuestSetChange(qIndex, 'category', e.target.value)}
                                     />
                                </div>
                                <div>
                                     <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Level</label>
                                     <select 
                                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                        value={quest.level}
                                        onChange={(e) => handleQuestSetChange(qIndex, 'level', e.target.value)}
                                     >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                     </select>
                                </div>
                            </div>

                            {/* Custom Form Fields */}
                            <div className="mb-6 p-4 bg-white/50 dark:bg-white/5 rounded-lg border border-chalk dark:border-white/5">
                                <h3 className="text-sm font-bold text-primary dark:text-chalk mb-2">Custom Application Form Labels</h3>
                                <p className="text-xs text-ash/60 dark:text-chalk/40 mb-3">Override global defaults for this quest. Leave blank to use defaults.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Name Label</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                            value={quest.customFields?.nameLabel || ''}
                                            onChange={(e) => handleQuestCustomFieldChange(qIndex, 'nameLabel', e.target.value)}
                                            placeholder={config.nameLabel || "Full Name"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Email Label</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                            value={quest.customFields?.emailLabel || ''}
                                            onChange={(e) => handleQuestCustomFieldChange(qIndex, 'emailLabel', e.target.value)}
                                            placeholder={config.emailLabel || "Email Address"}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Reason Label</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                            value={quest.customFields?.whyJoinLabel || ''}
                                            onChange={(e) => handleQuestCustomFieldChange(qIndex, 'whyJoinLabel', e.target.value)}
                                            placeholder={config.whyJoinLabel || "Why do you want to join?"}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quest Sessions */}
                            <div className="mb-6 p-4 bg-white/50 dark:bg-white/5 rounded-lg border border-chalk dark:border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-primary dark:text-chalk uppercase">Quest Sessions</h3>
                                    <button 
                                        onClick={() => addQuestSession(qIndex)}
                                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-icons-outlined text-xs">add</span> Add Session
                                    </button>
                                </div>
                                <div className="space-y-3">
                                     {(quest.sessions || []).map((session, sIndex) => (
                                        <div key={session.id || sIndex} className="p-3 bg-white dark:bg-black/20 rounded-lg border border-chalk dark:border-white/5">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="text-xs font-bold text-primary/70 dark:text-chalk/70 uppercase">Session {sIndex + 1}</h4>
                                                <button onClick={() => removeQuestSession(qIndex, sIndex)} className="text-ash/40 hover:text-red-500"><span className="material-icons-outlined text-sm">close</span></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input 
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm"
                                                    value={session.title}
                                                    onChange={(e) => handleQuestSessionChange(qIndex, sIndex, 'title', e.target.value)}
                                                    placeholder="Title"
                                                />
                                                <input 
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm"
                                                    value={session.date}
                                                    onChange={(e) => handleQuestSessionChange(qIndex, sIndex, 'date', e.target.value)}
                                                    placeholder="Date"
                                                />
                                                <input 
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm"
                                                    value={session.time}
                                                    onChange={(e) => handleQuestSessionChange(qIndex, sIndex, 'time', e.target.value)}
                                                    placeholder="Time"
                                                />
                                                <input 
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm"
                                                    value={session.location}
                                                    onChange={(e) => handleQuestSessionChange(qIndex, sIndex, 'location', e.target.value)}
                                                    placeholder="Location"
                                                />
                                            </div>
                                        </div>
                                     ))}
                                </div>
                            </div>

                            {/* Quest Resources */}
                            <div className="mb-6 p-4 bg-white/50 dark:bg-white/5 rounded-lg border border-chalk dark:border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-primary dark:text-chalk uppercase">Class Resources</h3>
                                    <button 
                                        onClick={() => addQuestResource(qIndex)}
                                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-icons-outlined text-xs">add</span> Add Resource
                                    </button>
                                </div>
                                <div className="space-y-3">
                                     {(quest.resources || []).map((resource, rIndex) => (
                                        <div key={resource.id || rIndex} className="p-3 bg-white dark:bg-black/20 rounded-lg border border-chalk dark:border-white/5">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="text-xs font-bold text-primary/70 dark:text-chalk/70 uppercase">Resource {rIndex + 1}</h4>
                                                <button onClick={() => removeQuestResource(qIndex, rIndex)} className="text-ash/40 hover:text-red-500"><span className="material-icons-outlined text-sm">close</span></button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <input 
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm font-bold"
                                                    value={resource.title}
                                                    onChange={(e) => handleQuestResourceChange(qIndex, rIndex, 'title', e.target.value)}
                                                    placeholder="Resource Title"
                                                />
                                                <select
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm"
                                                    value={resource.type}
                                                    onChange={(e) => handleQuestResourceChange(qIndex, rIndex, 'type', e.target.value)}
                                                >
                                                    <option value="link">Link</option>
                                                    <option value="video">Video</option>
                                                    <option value="document">Document</option>
                                                    <option value="stream">Stream</option>
                                                </select>
                                                <input 
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm md:col-span-2"
                                                    value={resource.url}
                                                    onChange={(e) => handleQuestResourceChange(qIndex, rIndex, 'url', e.target.value)}
                                                    placeholder="URL (https://...)"
                                                />
                                                <input 
                                                    className="px-2 py-1 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm md:col-span-2"
                                                    value={resource.description || ''}
                                                    onChange={(e) => handleQuestResourceChange(qIndex, rIndex, 'description', e.target.value)}
                                                    placeholder="Description (Optional)"
                                                />
                                            </div>
                                        </div>
                                     ))}
                                </div>
                            </div>

                            {/* Quest Tasks Sub-section */}
                            <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4 border border-chalk dark:border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-primary dark:text-chalk uppercase">Application Tasks</h3>
                                    <button 
                                        onClick={() => addQuestTask(qIndex)}
                                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-icons-outlined text-xs">add</span> Add Task
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {quest.tasks.map((task, tIndex) => (
                                        <div key={task.id || tIndex} className="flex gap-3 items-start p-3 bg-white dark:bg-black/20 rounded-lg border border-chalk dark:border-white/5">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-1">
                                                {tIndex + 1}
                                            </div>
                                            <div className="flex-1 grid gap-2">
                                                <input 
                                                    type="text" 
                                                    className="w-full px-2 py-1.5 bg-transparent border-b border-ash/20 focus:border-primary outline-none text-sm text-primary dark:text-chalk"
                                                    value={task.description}
                                                    onChange={(e) => handleQuestTaskChange(qIndex, tIndex, 'description', e.target.value)}
                                                    placeholder="Task Description"
                                                />
                                                <div className="flex gap-2">
                                                    <select 
                                                        className="px-2 py-1 bg-ash/5 rounded text-xs text-ash dark:text-chalk/60 border-none outline-none"
                                                        value={task.proofType}
                                                        onChange={(e) => handleQuestTaskChange(qIndex, tIndex, 'proofType', e.target.value)}
                                                    >
                                                        <option value="text">Text Proof</option>
                                                        <option value="link">Link Proof</option>
                                                        <option value="image">Image Proof</option>
                                                        <option value="yes_no">Yes/No</option>
                                                        <option value="username">Username</option>
                                                    </select>
                                                    <input 
                                                        type="text" 
                                                        className="flex-1 px-2 py-1 bg-ash/5 rounded text-xs text-primary dark:text-chalk outline-none"
                                                        value={task.link || ''}
                                                        onChange={(e) => handleQuestTaskChange(qIndex, tIndex, 'link', e.target.value)}
                                                        placeholder="Optional Link URL"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeQuestTask(qIndex, tIndex)}
                                                className="text-ash/40 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-icons-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Quest Modules (Curriculum) */}
                            <div className="mb-6 p-4 bg-white/50 dark:bg-white/5 rounded-lg border border-chalk dark:border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-primary dark:text-chalk uppercase">Learning Path (Modules)</h3>
                                    <button 
                                        onClick={() => addQuestModule(qIndex)}
                                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-icons-outlined text-xs">add</span> Add Module
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {(quest.modules || []).map((module, mIndex) => (
                                        <div key={module.id || mIndex} className="p-4 bg-white dark:bg-black/20 rounded-lg border-l-4 border-primary shadow-sm">
                                            <div className="flex justify-between mb-2">
                                                <input 
                                                    className="font-bold text-primary dark:text-chalk bg-transparent border-b border-transparent focus:border-primary outline-none"
                                                    value={module.title}
                                                    onChange={(e) => handleQuestModuleChange(qIndex, mIndex, 'title', e.target.value)}
                                                    placeholder="Module Title"
                                                />
                                                <button onClick={() => removeQuestModule(qIndex, mIndex)} className="text-ash/40 hover:text-red-500"><span className="material-icons-outlined text-sm">delete</span></button>
                                            </div>
                                            <textarea 
                                                className="w-full text-xs bg-transparent border-none resize-none text-ash dark:text-chalk/60 focus:ring-0 p-0 mb-3"
                                                value={module.description}
                                                onChange={(e) => handleQuestModuleChange(qIndex, mIndex, 'description', e.target.value)}
                                                placeholder="Module description..."
                                                rows={1}
                                            />
                                            
                                            {/* Challenges within Module */}
                                            <div className="pl-4 border-l-2 border-ash/10 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-ash/60 uppercase">Challenges</span>
                                                    <button onClick={() => addModuleChallenge(qIndex, mIndex)} className="text-xs text-primary hover:underline">+ Add Challenge</button>
                                                </div>
                                                {module.challenges.map((challenge, cIndex) => (
                                                    <div key={challenge.id} className="flex gap-2 items-center bg-ash/5 p-2 rounded">
                                                        <span className="text-xs font-bold text-primary bg-primary/10 px-1 rounded">XP {challenge.xp}</span>
                                                        <input 
                                                            className="flex-1 text-xs bg-transparent border-none outline-none text-primary dark:text-chalk"
                                                            value={challenge.title}
                                                            onChange={(e) => handleModuleChallengeChange(qIndex, mIndex, cIndex, 'title', e.target.value)}
                                                            placeholder="Challenge Title"
                                                        />
                                                        <select 
                                                            className="text-xs bg-transparent border-none outline-none text-ash/60"
                                                            value={challenge.proofType}
                                                            onChange={(e) => handleModuleChallengeChange(qIndex, mIndex, cIndex, 'proofType', e.target.value)}
                                                        >
                                                            <option value="link">Link</option>
                                                            <option value="github">GitHub</option>
                                                            <option value="text">Text</option>
                                                            <option value="image">Image</option>
                                                        </select>
                                                        <button onClick={() => removeModuleChallenge(qIndex, mIndex, cIndex)} className="text-ash/40 hover:text-red-500"><span className="material-icons-outlined text-xs">close</span></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {(quest.modules || []).length === 0 && (
                                        <p className="text-xs text-ash/40 italic text-center py-4">No learning modules yet. Add one to start the curriculum.</p>
                                    )}
                                </div>
                            </div>
                            
                             <div className="flex justify-between mt-6 pt-6 border-t border-ash/10">
                                <button 
                                    onClick={() => {
                                        if (quest.status === 'draft') {
                                            if (confirm('Discard changes?')) {
                                                setExpandedQuestIndex(null);
                                            }
                                        } else {
                                            setExpandedQuestIndex(null);
                                        }
                                    }}
                                    className="px-4 py-2 text-ash hover:text-primary transition-colors font-bold"
                                >
                                    {quest.status === 'draft' ? 'Cancel' : 'Close'}
                                </button>
                                
                                <div className="flex gap-3">
                                    {quest.status === 'draft' && (
                                        <button 
                                            onClick={() => {
                                               setExpandedQuestIndex(null);
                                            }}
                                            className="px-4 py-2 bg-ash/10 text-primary rounded-lg font-bold hover:bg-ash/20 transition-colors"
                                        >
                                            Save Draft
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => {
                                            if (quest.status === 'draft') {
                                                handleQuestSetChange(qIndex, 'status', 'active');
                                            }
                                            setExpandedQuestIndex(null);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                                            quest.status === 'draft' 
                                            ? 'bg-accent text-primary hover:bg-accent/90' 
                                            : 'bg-primary text-white hover:bg-primary/90'
                                        }`}
                                    >
                                        {quest.status === 'draft' ? 'Publish Quest' : 'Done Editing'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    );
                }

                // Compact Card View
                return (
                    <div 
                        key={quest.id || qIndex} 
                        className="group p-6 rounded-xl border border-chalk dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
                        onClick={() => setExpandedQuestIndex(qIndex)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                quest.status === 'active' ? 'bg-green-100 text-green-700' :
                                quest.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {quest.status || 'Draft'}
                            </span>
                            <span className="material-icons-outlined text-ash/40 group-hover:text-primary transition-colors">edit</span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-primary dark:text-white mb-2 line-clamp-2">{quest.title}</h3>
                        <p className="text-sm text-ash dark:text-chalk/60 mb-4 line-clamp-3 flex-1">{quest.description || 'No description provided.'}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-ash/60 dark:text-chalk/40 mt-auto pt-4 border-t border-ash/10">
                            <div className="flex items-center gap-1">
                                <span className="material-icons-outlined text-sm">group</span>
                                <span>{quest.capacity || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-icons-outlined text-sm">event</span>
                                <span>{quest.sessions?.length || 0} Sessions</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-icons-outlined text-sm">task_alt</span>
                                <span>{quest.tasks?.length || 0} Tasks</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* General Info */}
      <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10">
        <h2 className="text-lg font-bold text-primary dark:text-white mb-4">General Information</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-ash dark:text-chalk/80 mb-1">Class Title</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-chalk/30 dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ash dark:text-chalk/80 mb-1">Instructor (Class Host)</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-chalk/30 dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
              value={config.instructor || ''}
              onChange={(e) => setConfig({ ...config, instructor: e.target.value })}
              placeholder="e.g. Sarah Drasner"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ash dark:text-chalk/80 mb-1">Description</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 bg-chalk/30 dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk resize-none"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ash dark:text-chalk/80 mb-1">Extra Notes (Portal Only)</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 bg-chalk/30 dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk resize-none"
              value={config.extraNotes || ''}
              onChange={(e) => setConfig({ ...config, extraNotes: e.target.value })}
              placeholder="Additional info visible only to accepted students in the portal."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ash dark:text-chalk/80 mb-1">Class Capacity</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 bg-chalk/30 dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
              value={config.capacity || 50}
              onChange={(e) => setConfig({ ...config, capacity: parseInt(e.target.value) || 0 })}
              placeholder="e.g. 50"
            />
            <p className="text-xs text-ash/60 mt-1">Used to calculate 'Spots Left' indicator (Approved vs Capacity).</p>
          </div>
        </div>
      </div>

{/* Sessions Config (Legacy - Removed) */}


      {/* Standard Fields Config */}
      <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10">
        <h2 className="text-lg font-bold text-primary dark:text-white mb-4">Standard Application Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Name Field Label</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
              value={config.nameLabel || ''}
              onChange={(e) => setConfig({ ...config, nameLabel: e.target.value })}
              placeholder="Full Name"
            />
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Email Field Label</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
              value={config.emailLabel || ''}
              onChange={(e) => setConfig({ ...config, emailLabel: e.target.value })}
              placeholder="Email Address"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Reason to Join Label</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
              value={config.whyJoinLabel || ''}
              onChange={(e) => setConfig({ ...config, whyJoinLabel: e.target.value })}
              placeholder="Why do you want to join?"
            />
          </div>
        </div>
      </div>

{/* Tasks Config (Legacy - Removed) */}




      {/* Class Resources Config */}
      <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-primary dark:text-white">Class Content & Resources</h2>
            <button 
                onClick={addResource}
                className="px-3 py-1.5 bg-eucalyptus/30 text-primary dark:text-eucalyptus rounded-lg text-sm font-bold hover:bg-eucalyptus hover:text-primary transition-colors flex items-center gap-1"
            >
                <span className="material-icons-outlined text-sm">add</span> Add Resource
            </button>
        </div>

        <div className="grid gap-4">
            {config.resources && config.resources.map((resource, index) => (
                <div key={resource.id || index} className="p-4 rounded-xl border border-chalk dark:border-white/10 bg-chalk/10 dark:bg-white/5 flex flex-col md:flex-row gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-primary dark:text-chalk shrink-0 mt-1">
                        <span className="material-icons-outlined">
                            {resource.type === 'video' ? 'play_circle' : 
                             resource.type === 'stream' ? 'video_camera_front' : 
                             resource.type === 'community' ? 'forum' : 
                             resource.type === 'document' ? 'article' : 'link'}
                        </span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        <div className="md:col-span-2">
                             <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Title</label>
                             <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                value={resource.title}
                                onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                             />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Description</label>
                             <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                value={resource.description}
                                onChange={(e) => handleResourceChange(index, 'description', e.target.value)}
                             />
                        </div>
                        <div>
                             <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">URL</label>
                             <input 
                                type="url" 
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                value={resource.url}
                                onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                             />
                        </div>
                         <div>
                             <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Type</label>
                             <select 
                                className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                value={resource.type}
                                onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                             >
                                <option value="link">Link</option>
                                <option value="video">Video</option>
                                <option value="stream">Live Stream</option>
                                <option value="community">Community / Chat</option>
                                <option value="document">Document / PDF</option>
                             </select>
                        </div>
                    </div>

                    <button 
                        onClick={() => removeResource(index)}
                        className="p-2 text-ash/40 hover:text-red-500 dark:text-chalk/20 dark:hover:text-red-400 transition-colors self-start md:self-center"
                        title="Remove Resource"
                    >
                        <span className="material-icons-outlined">delete_outline</span>
                    </button>
                </div>
            ))}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-20">
        <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-4 bg-primary text-white rounded-full font-bold shadow-2xl hover:bg-primary/90 transition-all flex items-center gap-2 transform hover:scale-105"
        >
            <span className="material-icons-outlined">save</span>
            {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};