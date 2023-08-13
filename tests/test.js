
const request = require("supertest");
const app = require("../index");

// Test case to see if newssearch is working for 12 days

describe("POST /newssearch", () => {
    it("should return apple news for last 12 days", async () => {
      const res = await request(app).post("/newssearch").send({
        keyword: "apple",
        interval: 12,
        timespan: "days",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

// Test case to see if newssearch is working for 36 hours

  describe("POST /newssearch", () => {
    it("should return apple news for last 36 hours", async () => {
      const res = await request(app).post("/newssearch").send({
        keyword: "apple",
        interval: 36,
        timespan: "hours",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // Test case to see if newssearch is working for default setting

  describe("POST /newssearch", () => {
    it("should return apple news for default case", async () => {
      const res = await request(app).post("/newssearch").send({
        keyword: "apple"
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });