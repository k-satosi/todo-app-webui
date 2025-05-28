import { useState, useEffect } from 'react'
import { Sun, Moon, Trash2, Plus, Calendar } from 'lucide-react'
import { format, isAfter } from 'date-fns'
import { ja } from 'date-fns/locale'
import './App.css'

import { Button } from './components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Switch } from './components/ui/switch'
import { Label } from './components/ui/label'
import { Separator } from './components/ui/separator'

interface Task {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      return JSON.parse(savedTasks, (key, value) => {
        if (key === 'dueDate') {
          const date = new Date(value);
          console.log('Loading date from localStorage:', date);
          return date;
        }
        return value;
      });
    }
    return [];
  });
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  const addTask = () => {
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
      
      if (newTaskDueDate.includes('/')) {
        const parts = newTaskDueDate.split('/');
        if (parts.length === 3 && parseInt(parts[0]) <= 12) {
          const month = parseInt(parts[0]) - 1;
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          console.log('Date parts (MM/DD/YYYY):', { year, month, day });
          dueDate = new Date(year, month, day);
        } else {
          dueDate = new Date(newTaskDueDate);
        }
      } else if (newTaskDueDate.includes('-')) {
        const parts = newTaskDueDate.split('-');
        if (parts.length === 3) {
          const yearNum = parseInt(parts[0]);
          if (yearNum >= 1900 && yearNum <= 2100) {
            const year = yearNum;
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            console.log('Date parts (YYYY-MM-DD):', { year, month, day });
            dueDate = new Date(year, month, day);
          } else {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            console.log('Date parts (rearranged):', { year, month, day });
            dueDate = new Date(year, month, day);
          }
        } else {
          dueDate = new Date(newTaskDueDate);
        }
      } else {
        dueDate = new Date(newTaskDueDate);
      }
      
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
      const newTask: Task = {
        id: String(Date.now()),
        title: newTaskTitle,
        dueDate: dueDate,
        completed: false
      };
      
      console.log('Created new task:', newTask);
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      console.log('Updated tasks state');
      
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
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
                />
              </div>
              <div>
                <Label htmlFor="dueDate">期日</Label>
                <Input
                  id="dueDate"
                  type="text" 
                  placeholder="YYYY-MM-DD"
                  value={newTaskDueDate}
                  onChange={(e) => {
                    console.log("Date input raw value:", e.target.value);
                    setNewTaskDueDate(e.target.value);
                  }}
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={addTask} className="w-full">
              <Plus size={16} className="mr-2" />
              タスクを追加
            </Button>
          </CardFooter>
        </Card>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">タスク一覧</h2>
          
          {tasks.length === 0 ? (
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
