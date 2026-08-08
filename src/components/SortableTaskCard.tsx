import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../types";
import TaskCard from "./TaskCard";

interface SortableTaskCardProps {
  key?: string | number;
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onPushToGCal: (task: Task) => void | Promise<void>;
  onSelectTask: (task: Task) => void;
  isConflict?: boolean;
}

export default function SortableTaskCard({
  task,
  onToggleComplete,
  onToggleSubtask,
  onDeleteTask,
  onPushToGCal,
  onSelectTask,
  isConflict = false,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" as const : undefined,
  };

  return (
    <TaskCard
      task={task}
      onToggleComplete={onToggleComplete}
      onToggleSubtask={onToggleSubtask}
      onDeleteTask={onDeleteTask}
      onPushToGCal={onPushToGCal}
      onSelectTask={onSelectTask}
      isConflict={isConflict}
      setNodeRef={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}
