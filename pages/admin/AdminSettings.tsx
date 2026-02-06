import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockService } from '../../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO, TaskConfig, ClassResource } from '../../types';

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

  // --- Task Management ---
  const handleTaskChange = (index: number, field: keyof TaskConfig, value: any) => {
    const newTasks = [...config.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setConfig({ ...config, tasks: newTasks });
  };

  const addTask = () => {
    const newTask: TaskConfig = {
      id: Math.random().toString(36).substr(2, 9),
      description: "New Task",
      requiresProof: false,
      proofType: "text"
    };
    setConfig({ ...config, tasks: [...config.tasks, newTask] });
  };

  const removeTask = (index: number) => {
    const newTasks = config.tasks.filter((_, i) => i !== index);
    setConfig({ ...config, tasks: newTasks });
  };

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
            <label className="block text-sm font-semibold text-ash dark:text-chalk/80 mb-1">Description</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 bg-chalk/30 dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk resize-none"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Tasks Config */}
      <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-primary dark:text-white">Application Tasks</h2>
            <button 
                onClick={addTask}
                className="px-3 py-1.5 bg-accent/20 text-primary dark:text-accent rounded-lg text-sm font-bold hover:bg-accent hover:text-primary transition-colors flex items-center gap-1"
            >
                <span className="material-icons-outlined text-sm">add</span> Add Task
            </button>
        </div>

        <div className="space-y-4">
          {config.tasks.map((task, index) => (
            <div key={task.id || index} className="p-4 rounded-xl border border-chalk dark:border-white/10 bg-chalk/10 dark:bg-white/5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                   {index + 1}
                </div>
                
                <div className="flex-1 grid gap-3">
                   {/* Description Line */}
                   <div>
                     <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Task Description</label>
                     <input 
                        type="text" 
                        className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                        value={task.description}
                        onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                        placeholder="e.g. Follow us on Twitter"
                      />
                   </div>

                   {/* Proof Config */}
                   <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center gap-2 pt-6">
                        <input 
                            type="checkbox"
                            className="rounded border-ash/30 text-primary focus:ring-primary"
                            checked={task.requiresProof}
                            onChange={(e) => handleTaskChange(index, 'requiresProof', e.target.checked)}
                        />
                        <span className="text-sm font-medium text-primary dark:text-chalk">Requires User Input</span>
                      </div>

                      {task.requiresProof && (
                          <>
                             <div className="flex-1">
                                <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Input Label</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                    value={task.proofLabel || ''}
                                    onChange={(e) => handleTaskChange(index, 'proofLabel', e.target.value)}
                                    placeholder="e.g. Your Twitter Handle"
                                />
                             </div>
                             <div className="w-32">
                                <label className="block text-xs uppercase font-bold text-ash/60 dark:text-chalk/40 mb-1">Input Type</label>
                                <select 
                                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-chalk dark:border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                                    value={task.proofType || 'text'}
                                    onChange={(e) => handleTaskChange(index, 'proofType', e.target.value)}
                                >
                                    <option value="text">Text</option>
                                    <option value="link">URL Link</option>
                                    <option value="username">Username</option>
                                    <option value="image">Image Upload</option>
                                </select>
                             </div>
                          </>
                      )}
                   </div>
                </div>

                <button 
                  onClick={() => removeTask(index)}
                  className="p-2 text-ash/40 hover:text-red-500 dark:text-chalk/20 dark:hover:text-red-400 transition-colors"
                  title="Remove Task"
                >
                  <span className="material-icons-outlined">delete_outline</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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