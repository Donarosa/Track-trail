'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { AssignmentWithTraining } from '@/types/database';

interface TrainingCardProps {
  assignment: AssignmentWithTraining;
}

export default function TrainingCard({ assignment }: TrainingCardProps) {
  const { training } = assignment;

  if (!training) return null;

  return (
    <Link href={`/training/${assignment.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{training.title}</h3>
            <p className="text-sm text-foreground/60 mt-0.5">
              {new Date(training.date).toLocaleDateString('es-AR')}
            </p>
            {training.description && (
              <p className="text-sm text-foreground/50 mt-1">{training.description}</p>
            )}
            <p className="text-xs text-foreground/40 mt-2">
              {training.training_blocks?.length ?? 0} bloques
            </p>
          </div>
          <Badge variant={assignment.status === 'completed' ? 'success' : 'warning'}>
            {assignment.status === 'completed' ? 'Completado' : 'Pendiente'}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
