import { Socket } from "socket.io";
import requestIp from "request-ip";

export const getRealClientIP = (socket: Socket): string => {
  try {
    const clientIp = requestIp.getClientIp(socket.request);

    if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
      // Clean IPv6 mapped IPv4 addresses
      const cleanIp = clientIp.replace(/^::ffff:/, "");

      // Validate the IP
      if (isValidIP(cleanIp)) {
        return cleanIp;
      }
    }

    // Fallback to socket handshake address
    const fallbackIp = socket.handshake.address;
    if (fallbackIp && fallbackIp !== "::1" && fallbackIp !== "127.0.0.1") {
      const cleanIp = fallbackIp.replace(/^::ffff:/, "");
      if (isValidIP(cleanIp)) {
        return cleanIp;
      }
    }

    // Return localhost for development
    return "127.0.0.1";
  } catch (error) {
    console.error("Error detecting IP:", error);
    return "127.0.0.1";
  }
};

/**
 * Simple IP validation
 */
const isValidIP = (ip: string): boolean => {
  // IPv4 regex
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (basic)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};
