import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";
import { AuthProvider } from "../lib/auth";

jest.mock("../lib/api", () => ({
  api: { post: jest.fn(), get: jest.fn() },
  formatApiError: (msg) => msg || "Error",
}));

const MockedLogin = () => (
  <MemoryRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </MemoryRouter>
);

describe("Login Page", () => {
  it("renders login form", () => {
    render(<MockedLogin />);
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-btn")).toBeInTheDocument();
  });

  it("shows validation error for empty email on submit", async () => {
    const user = userEvent.setup();
    render(<MockedLogin />);
    
    await user.click(screen.getByTestId("login-submit-btn"));
    
    await waitFor(() => {
      expect(screen.getByTestId("login-email-error")).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<MockedLogin />);
    
    await user.type(screen.getByTestId("login-email-input"), "invalidemail");
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByTestId("login-email-error")).toBeInTheDocument();
    });
  });

  it("shows validation error for empty password", async () => {
    const user = userEvent.setup();
    render(<MockedLogin />);
    
    await user.type(screen.getByTestId("login-email-input"), "test@test.com");
    await user.click(screen.getByTestId("login-submit-btn"));
    
    await waitFor(() => {
      expect(screen.getByTestId("login-password-error")).toBeInTheDocument();
    });
  });

  it("links to register page", () => {
    render(<MockedLogin />);
    expect(screen.getByTestId("login-register-link")).toHaveAttribute("href", "/register");
  });
});
