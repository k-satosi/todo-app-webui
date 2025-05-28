import { useState, useEffect } from 'react'
import { Sun, Moon, Trash2, Plus, Calendar, Loader2 } from 'lucide-react'
import { format, isAfter } from 'date-fns'
import { ja } from 'date-fns/locale'
import './App.css'

import { Button } from './components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Switch } from './components/ui/switch'
import { Label } from './components/ui/label'
import { Separator } from './components/ui/separator'

import { Task, getTasks, createTask, updateTask, deleteTask as apiDeleteTask } from './api/taskApi'

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await getTasks();
        setTasks(fetchedTasks);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError('タスクの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  const addTask = async () => {
    console.log('Adding task with:', { title: newTaskTitle, dueDate: newTaskDueDate });
    
    if (newTaskTitle.trim() === '') {
      console.log('Task title is empty, not adding');
      return;
    }
    
    if (newTaskDueDate === '') {
      console.log('Due date is empty, not adding');
      return;
    }
    
    let dueDate: Date;
    try {
      console.log('Date string before parsing:', newTaskDueDate);
      
      dueDate = new Date(newTaskDueDate + 'T00:00:00');
      
      console.log('Parsed date:', dueDate);
      
      if (isNaN(dueDate.getTime())) {
        console.error('Invalid date format');
        return;
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const taskRequest = {
        title: newTaskTitle,
        dueDate: dueDate,
        completed: false
      };
      
      const newTask = await createTask(taskRequest);
      console.log('Created new task:', newTask);
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      console.log('Updated tasks state');
      
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (error) {
      console.error('Error creating task:', error);
      setError('タスクの作成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const taskToUpdate = tasks.find(task => task.id === id);
      if (!taskToUpdate) {
        console.error('Task not found:', id);
        return;
      }
      
      const updatedTask = await updateTask(id, {
        ...taskToUpdate,
        completed: !taskToUpdate.completed
      });
      
      setTasks(tasks.map(task => 
        task.id === id ? updatedTask : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      setError('タスクの更新に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiDeleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('タスクの削除に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const isTaskOverdue = (task: Task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !task.completed && isAfter(today, task.dueDate);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className={`min-h-screen p-4 ${isDarkTheme ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="container mx-auto max-w-3xl">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">TODOアプリ</h1>
          <div className="flex items-center gap-2">
            <Sun size={20} className={isDarkTheme ? 'text-slate-400' : 'text-yellow-500'} />
            <Switch 
              checked={isDarkTheme}
              onCheckedChange={toggleTheme}
              aria-label="テーマ切り替え"
            />
            <Moon size={20} className={isDarkTheme ? 'text-blue-300' : 'text-slate-400'} />
          </div>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900 dark:text-red-100 dark:border-red-800">
            <p>{error}</p>
          </div>
        )}

        <Card className={isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle>新しいタスク</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="タスクを入力"
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600' : ''}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">期日</Label>
                <Input
                  id="dueDate"
                  type="date" 
                  value={newTaskDueDate}
                  onChange={(e) => {
                    console.log("Date input raw value:", e.target.value);
                    setNewTaskDueDate(e.target.value);
                  }}
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600' : ''}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={addTask} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  タスクを追加
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">タスク一覧</h2>
          
          {loading && tasks.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-center py-4 text-slate-500">タスクがありません</p>
          ) : (
            tasks.map(task => (
              <Card 
                key={task.id} 
                className={`
                  ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white'}
                  ${isTaskOverdue(task) ? (isDarkTheme ? 'border-red-500' : 'border-red-500') : ''}
                `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Switch 
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        aria-label="タスク完了状態"
                        disabled={loading}
                      />
                      <div>
                        <h3 className={`font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center mt-1 text-sm">
                          <Calendar size={14} className="mr-1" />
                          <span className={isTaskOverdue(task) ? 'text-red-500 font-semibold' : ''}>
                            {format(task.dueDate, 'yyyy年MM月dd日', { locale: ja })}
                            {isTaskOverdue(task) && ' (期限切れ)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteTask(task.id)}
                      aria-label="タスクを削除"
                      disabled={loading}
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App
