// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it('renders a button that fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Download PNG</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults type to "button" so it never submits a surrounding form', () => {
    render(<Button>Go</Button>);

    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  it.each([
    ['primary', 'bg-neutral-900'],
    ['success', 'bg-emerald-600'],
    ['secondary', 'bg-black/[0.05]'],
    ['ghost', 'text-neutral-500'],
  ] as const)('applies the %s variant style', (variant, markerClass) => {
    render(<Button variant={variant}>Press</Button>);

    expect(screen.getByRole('button').className).toContain(markerClass);
  });

  it('applies the icon size style for toolbar buttons', () => {
    render(
      <Button size="icon" title="Zoom in">
        +
      </Button>
    );

    expect(screen.getByRole('button').className).toContain('p-1');
  });

  it('merges caller classes with the variant classes', () => {
    render(<Button className="w-full">Wide</Button>);

    expect(screen.getByRole('button').className).toContain('w-full');
    expect(screen.getByRole('button').className).toContain('bg-black/[0.05]');
  });

  it('passes through button attributes like disabled and title', () => {
    render(
      <Button disabled title="Copy to clipboard">
        Copy
      </Button>
    );

    const el = screen.getByRole('button', { name: 'Copy' });
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('title')).toBe('Copy to clipboard');
  });
});
