import { Test, TestingModule } from "@nestjs/testing"
import { HealthController } from "./health.controller"
import { HealthService } from "./health.service"

describe("HealthController", () => {
  let controller: HealthController

  const mockHealthService = {
    check: jest.fn().mockResolvedValue({
      status: "ok",
      database: "connected",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  it("GET /health should return health status", async () => {
    const result = await controller.check()
    expect(result.status).toBe("ok")
    expect(result.database).toBe("connected")
  })
})
