import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../src/App';

describe('App（Hello 畫面）', () => {
  it('渲染標題與卡牌總數', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('風場大戰');
    expect(container.textContent).toContain('47');
  });
});
