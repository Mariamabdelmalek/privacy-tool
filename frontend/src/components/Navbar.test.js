// src/components/Navbar.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

describe('Navbar Component', () => {
  test('renders navigation links', () => {
    const mockLogout = jest.fn();
    
    render(
      <BrowserRouter>
        <Navbar onLogout={mockLogout} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Reports/i)).toBeInTheDocument();
  });

  test('calls onLogout when logout button is clicked', () => {
    const mockLogout = jest.fn();
    
    render(
      <BrowserRouter>
        <Navbar onLogout={mockLogout} />
      </BrowserRouter>
    );
    
    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
