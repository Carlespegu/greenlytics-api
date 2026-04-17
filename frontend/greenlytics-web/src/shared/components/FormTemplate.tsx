import type { PropsWithChildren } from 'react';

import { PageHeader } from '@/shared/components/PageHeader';

interface FormTemplateProps extends PropsWithChildren {
  title: string;
  description: string;
}

export function FormTemplate({ title, description, children }: FormTemplateProps) {
  return (
    <div className="module-page">
      <PageHeader title={title} description={description} />
      <section className="panel-card">{children}</section>
    </div>
  );
}
