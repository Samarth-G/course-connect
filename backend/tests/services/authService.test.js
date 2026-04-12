import { jest } from "@jest/globals";

const hashMock = jest.fn();
const compareMock = jest.fn();
const signMock = jest.fn();

const createUserMock = jest.fn();
const findUserByEmailMock = jest.fn();
const findUserByIdMock = jest.fn();
const updateUserByIdMock = jest.fn();

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: hashMock,
    compare: compareMock,
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: signMock,
  },
}));

jest.unstable_mockModule("../../repositories/authRepository.js", () => ({
  createUser: createUserMock,
  findUserByEmail: findUserByEmailMock,
  findUserById: findUserByIdMock,
  updateUserById: updateUserByIdMock,
}));

const {
  registerUser,
  loginUser,
  getUserProfileById,
  updateUserProfile,
} = await import("../../services/authService.js");

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signMock.mockReturnValue("token-123");
  });

  test("registerUser returns EMAIL_EXISTS when duplicate email exists", async () => {
    findUserByEmailMock.mockResolvedValue({ id: "u1" });

    const result = await registerUser({ name: "A", email: "a@a.com", password: "password123" });

    expect(result).toEqual({ errorCode: "EMAIL_EXISTS" });
  });

  test("registerUser hashes password and returns token payload", async () => {
    findUserByEmailMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed");
    createUserMock.mockResolvedValue({
      toJSON: () => ({ id: "u2", email: "new@example.com", name: "New User", role: "user", profileImage: "" }),
    });

    const result = await registerUser({
      name: "New User",
      email: "new@example.com",
      password: "password123",
    });

    expect(hashMock).toHaveBeenCalledWith("password123", 10);
    expect(signMock).toHaveBeenCalled();
    expect(result).toMatchObject({
      token: "token-123",
      user: { id: "u2", email: "new@example.com" },
    });
  });

  test("loginUser handles invalid credentials, disabled account, and success", async () => {
    findUserByEmailMock.mockResolvedValueOnce(null);
    await expect(loginUser({ email: "none@example.com", password: "x" })).resolves.toEqual({
      errorCode: "INVALID_CREDENTIALS",
    });

    findUserByEmailMock.mockResolvedValueOnce({ enabled: false });
    await expect(loginUser({ email: "off@example.com", password: "x" })).resolves.toEqual({
      errorCode: "ACCOUNT_DISABLED",
    });

    findUserByEmailMock.mockResolvedValueOnce({
      enabled: true,
      passwordHash: "stored-hash",
      toJSON: () => ({ id: "u3", email: "ok@example.com", name: "Ok" }),
    });
    compareMock.mockResolvedValue(true);

    await expect(loginUser({ email: "ok@example.com", password: "password" })).resolves.toMatchObject({
      token: "token-123",
      user: { id: "u3" },
    });
  });

  test("profile wrappers return null-safe JSON", async () => {
    findUserByIdMock.mockResolvedValue(null);
    updateUserByIdMock.mockResolvedValue({ toJSON: () => ({ id: "u4", name: "Updated" }) });

    await expect(getUserProfileById("missing")).resolves.toBeNull();
    await expect(updateUserProfile("u4", { name: "Updated" })).resolves.toEqual({ id: "u4", name: "Updated" });
  });
});
