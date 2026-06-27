import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "../pages/Register";
import { AuthProvider } from "../lib/auth";

jest.mock("../lib/api", () => ({
  api: { post: jest.fn(), get: jest.fn() },
  formatApiError: (msg) => msg || "Error",
}));

const MockedRegister = ({ initialRole } = {}) => (
  <MemoryRouter initialEntries={initialRole ? [`/register?role=${initialRole}`] : ["/register"]}>
    <AuthProvider>
      <Register />
    </AuthProvider>
  </MemoryRouter>
);

describe("Register Page", () => {
  it("renders register form with role buttons", () => {
    render(<MockedRegister />);
    expect(screen.getByTestId("register-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("register-role-student")).toBeInTheDocument();
    expect(screen.getByTestId("register-role-teacher")).toBeInTheDocument();
  });

  it("defaults to student role", () => {
    render(<MockedRegister />);
    expect(screen.getByTestId("register-role-student")).toHaveClass("bg-[#A5D6A7]");
  });

  it("switches to teacher role on click", async () => {
    const user = userEvent.setup();
    render(<MockedRegister />);
    
    await user.click(screen.getByTestId("register-role-teacher"));
    
    expect(screen.getByTestId("register-role-teacher")).toHaveClass("bg-[#8BC34A]");
  });

  it("shows validation error for short name", async () => {
    const user = userEvent.setup();
    render(<MockedRegister />);
    
    await user.type(screen.getByTestId("register-name-input"), "A");
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByTestId("register-name-error")).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(<MockedRegister />);
    
    await user.type(screen.getByTestId("register-password-input"), "123");
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByTestId("register-password-error")).toBeInTheDocument();
    });
  });

  it("does not submit with invalid data", async () => {
    const user = userEvent.setup();
    render(<MockedRegister />);
    
    await user.click(screen.getByTestId("register-submit-btn"));
    
    await waitFor(() => {
      expect(screen.getByTestId("register-name-error")).toBeInTheDocument();
      expect(screen.getByTestId("register-email-error")).toBeInTheDocument();
      expect(screen.getByTestId("register-password-error")).toBeInTheDocument();
    });
  });

  it("links to login page", () => {
    render(<MockedRegister />);
    expect(screen.getByTestId("register-login-link")).toHaveAttribute("href", "/login");
  });
});
