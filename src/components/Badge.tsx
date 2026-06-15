type Variant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange';

const styles: Record<Variant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-700',
};

export default function Badge({ label, variant = 'gray' }: { label: string; variant?: Variant }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}
