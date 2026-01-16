import { Card, Text, Badge, Button, Group } from '@mantine/core';

interface ProductProps {
  id: number;
  title: string;
  categories: string[];
  price: number;
  rentPrice: number;
  rentType: string;
}

export function ProductCard({ title, categories, price, rentPrice, rentType }: ProductProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{title}</Text>
        <Badge color="pink" variant="light">
          {categories[0]}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed">
        Buy: ${price} | Rent: ${rentPrice} ({rentType})
      </Text>

      <Button variant="light" color="blue" fullWidth mt="md" radius="md">
        View Details
      </Button>
    </Card>
  );
}