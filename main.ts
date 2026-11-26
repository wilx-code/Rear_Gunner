function drawCrashingEnemy (cx: number, cy: number, scale: number, roll: number) {
    cosine = Math.cos(roll)
    sine = Math.sin(roll)
    w = Math.max(1, Math.round(enemyImage.width * scale))
    h = Math.max(1, Math.round(enemyImage.height * scale))
    radius = Math.ceil(Math.sqrt(w * w + h * h) / 2)
    for (let dx2 = -radius; dx2 <= radius; dx2++) {
        for (let dy2 = -radius; dy2 <= radius; dy2++) {
            let sx = Math.floor((dx2 * cosine + dy2 * sine + w / 2) * enemyImage.width / w)
            let sy = Math.floor((-dx2 * sine + dy2 * cosine + h / 2) * enemyImage.height / h)
            if (sx >= 0 && sx < enemyImage.width && sy >= 0 && sy < enemyImage.height) {
                let c = enemyImage.getPixel(sx, sy)
                if (c != 0) {
                    terrain.setPixel(Math.round(cx + dx2), Math.round(cy + dy2), c)
                }
            }
        }
    }
flameSize = Math.max(2, Math.round(scale * 5))
    fillTriangle(cx - flameSize, cy, cx + flameSize, cy, cx + randint(0 - flameSize, flameSize), cy - flameSize * 2, 4)
    fillTriangle(cx - flameSize / 2, cy, cx + flameSize / 2, cy, cx, cy - flameSize, 5)
    terrain.setPixel(Math.round(cx), Math.round(cy), 1)
}
function renderBullets () {
    for (let i = bulletDepth.length - 1; i >= 0; i--) {

        bulletDepth[i] += 0.18

        let perspective = 1 / bulletDepth[i]

        let relativeYaw =
            (bulletYaw[i] - getViewYaw()) * Math.PI / 180

        let relativePitch =
            (getViewPitch() - bulletPitch[i]) * Math.PI / 180

        if (
            Math.abs(relativeYaw) < 1.4 &&
            Math.abs(relativePitch) < 1.4
        ) {

            let bx = 120 +
                Math.tan(relativeYaw) * focalLength +
                bulletX[i] * perspective

            let by = 90 +
                Math.tan(relativePitch) * focalLength +
                bulletY[i] * perspective

            let trailPerspective = 1 / Math.max(
                1, bulletDepth[i] - 0.5
            )

            let trailX = 120 +
                Math.tan(relativeYaw) * focalLength +
                bulletX[i] * trailPerspective

            let trailY = 90 +
                Math.tan(relativePitch) * focalLength +
                bulletY[i] * trailPerspective

            by += tilt * (bx - 120) / 120
            trailY += tilt * (trailX - 120) / 120

            if (
                bx >= 0 && bx < 240 &&
                by >= 0 && by < 180
            ) {

                terrain.drawLine(
                    Math.round(trailX),
                    Math.round(trailY),
                    Math.round(bx),
                    Math.round(by),
                    4
                )

                terrain.fillRect(
                    Math.round(bx),
                    Math.round(by),
                    2, 2, 5
                )
            }
        }

        if (bulletDepth[i] > 5) {

            bulletX.removeAt(i)
            bulletY.removeAt(i)
            bulletDepth.removeAt(i)
            bulletYaw.removeAt(i)
            bulletPitch.removeAt(i)
        }
    }
}
function getHorizon (screenPositionX: number) {
    return Math.round(90 + updown + tilt * (screenPositionX - 120) / 120)
}
function fillQuad (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, col: number) {
    fillTriangle(x1, y1, x2, y2, x3, y3, col)
    fillTriangle(x1, y1, x3, y3, x4, y4, col)
}
function getViewPitch () {
    return cameraPitch - aircraftPitch
}
function updatePilotAI () {
    pilotTimer += 33
    for (let n = 0; n <= enemyCount - 1; n++) {
        if (enemyHealth[n] > 0 && enemyZ[n] < 1000) {
            enemyNearby = true
        }
    }
    if (pilotState == 0) {
        targetRoll = Math.sin(pilotTimer / 1800) * 2
        targetPitch = Math.sin(pilotTimer / 2300) * 1.5
        targetYaw = 0
        targetSpeed = cruiseSpeed
        if (pilotTimer >= nextManeuver || enemyNearby && pilotTimer > 8000) {
            if (bombReleased) {
                pilotState = randint(1, 2)
            } else {
                pilotState = randint(1, 3)
            }
            pilotTimer = 0
            maneuverDirection = randint(0, 1) * 2 - 1
        }
    } else if (pilotState == 1) {
        targetRoll = maneuverDirection * 40
        targetYaw = maneuverDirection * 12
        targetPitch = 3
        targetSpeed = 215
        if (pilotTimer > 2200) {
            pilotState = 4
            pilotTimer = 0
        }
    } else if (pilotState == 2) {
        if (pilotTimer < 1600) {
            targetRoll = maneuverDirection * 35
            targetYaw = maneuverDirection * 15
        } else {
            targetRoll = (0 - maneuverDirection) * 40
            targetYaw = (0 - maneuverDirection) * 15
        }
        targetPitch = 0
        targetSpeed = 210
        if (pilotTimer > 3500) {
            pilotState = 4
            pilotTimer = 0
        }
    } else if (pilotState == 3) {
        targetRoll = maneuverDirection * 12
        targetPitch = -38
        targetYaw = maneuverDirection * 5
        targetSpeed = 280
        if (pilotTimer > 3200) {
            bombReleased = true
            bombingActive = true
            bombingTime = 0
            bombMessageTimer = 100
            pilotState = 5
            pilotTimer = 0
        }
    } else if (pilotState == 5) {
        targetPitch = 22
        targetRoll = 0
        targetYaw = 0
        targetSpeed = 230
        if (pilotTimer > 2200) {
            pilotState = 4
            pilotTimer = 0
        }
    } else if (pilotState == 4) {
        targetRoll = 0
        targetPitch = 0
        targetYaw = 0
        targetSpeed = cruiseSpeed
        if (pilotTimer > 2500) {
            pilotState = 0
            pilotTimer = 0
            nextManeuver = randint(15000, 30000)
        }
    }
    aircraftRoll += (targetRoll - aircraftRoll) * pilotResponsiveness
    aircraftPitch += (targetPitch - aircraftPitch) * pilotResponsiveness
    aircraftYaw += (targetYaw - aircraftYaw) * pilotResponsiveness
    speed += (targetSpeed - speed) * 0.025
    tilt = Math.tan(aircraftRoll * Math.PI / 180) * 120
}
function renderMuzzleFlash () {
    if (muzzleFlash > 0) {
        for (let gunIndex3 = 0; gunIndex3 <= 1; gunIndex3++) {
            side3 = gunIndex3 * 2 - 1
            fx = 120 + side3 * 9 + gunSwayX
            fy = 98 + gunSwayY + gunRecoil
            fillTriangle(fx - 4, fy, fx + 4, fy, fx, fy - randint(4, 7), 4)
            fillTriangle(fx - 2, fy, fx + 2, fy, fx, fy - 4, 5)
            terrain.setPixel(Math.round(fx), Math.round(fy - 1), 1)
        }
        muzzleFlash += 0 - 1
    }
}
function updateGunSway () {
    gunSwayX += ((0 - cameraVelocityX) * 2 - gunSwayX) * gunWeight
    gunSwayY += ((0 - cameraVelocityY) * 2 - gunSwayY) * gunWeight
}
function updateGunObstruction () {
    aircraftLayer.fill(0)
    background = terrain
    terrain = aircraftLayer
    renderAircraftBody()
    terrain = background
    gunsBlocked = false
    aimX = Math.round(120 + gunSwayX)
    aimY = Math.round(90 + gunSwayY)
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {

            if (aircraftLayer.getPixel(
                aimX + dx,
                aimY + dy
            ) != 0) {

                gunsBlocked = true
            }
        }
    }
}
function fireGuns () {
    if (gunsBlocked) {
        return
    }
    for (let gunIndex2 = 0; gunIndex2 <= 1; gunIndex2++) {
        side2 = gunIndex2 * 2 - 1
        bulletX.push(side2 * 9)
        bulletY.push(8)
        bulletDepth.push(1)
        bulletYaw.push(getViewYaw())
        bulletPitch.push(getViewPitch())
    }
    gunRecoil = 4
    muzzleFlash = 1
    shotThisFrame = true
}
function renderSight () {
    sightX = Math.round(120 + gunSwayX)
    sightY = Math.round(90 + gunSwayY)
    let sightColor = gunsBlocked ? 2 : 3
terrain.drawCircle(sightX, sightY, 10, sightColor)
terrain.drawCircle(sightX, sightY, 3, sightColor)
terrain.drawLine(sightX - 15, sightY, sightX - 6, sightY, sightColor)
    terrain.drawLine(sightX + 6, sightY, sightX + 15, sightY, sightColor)
    terrain.drawLine(sightX, sightY - 15, sightX, sightY - 6, sightColor)
    terrain.drawLine(sightX, sightY + 6, sightX, sightY + 15, sightColor)
    if (gunsBlocked) {
        terrain.fillRect(81, 38, 78, 12, 3)
        terrain.print("GUNS BLOCKED", 85, 40, 2)
    }
}
function projectMissionPoint (worldX: number, worldY: number, worldZ: number) {
    yaw2 = getViewYaw() * Math.PI / 180
    pitch2 = (0 - Math.max(-80, Math.min(80, getViewPitch()))) * Math.PI / 180
    rx3 = worldX * Math.cos(yaw2) - worldZ * Math.sin(yaw2)
    rz3 = worldX * Math.sin(yaw2) + worldZ * Math.cos(yaw2)
    ry3 = worldY * Math.cos(pitch2) - rz3 * Math.sin(pitch2)
    pointDepth = worldY * Math.sin(pitch2) + rz3 * Math.cos(pitch2)
    if (pointDepth <= 100) {
        return []
    }
    sx2 = 120 + rx3 * focalLength / pointDepth
    sy2 = 90 + ry3 * focalLength / pointDepth
    sy2 += tilt * (sx2 - 120) / 120
    return [sx2, sy2, pointDepth]
}
function renderCarrierExplosion () {
    if (!(bombingActive) || explosionTime <= 0) {
        return
    }
    for (let smokeIndex = 39; smokeIndex >= 0; smokeIndex--) {

        let smokeAge2 =
            (explosionTime - smokeIndex * 4) % 160

        if (smokeAge2 > 0) {

            let rise = smokeAge2 * 5

            let drift = rise * 0.18

            let turbulence = Math.sin(
                smokeAge2 * 0.09
            ) * (8 + rise * 0.06)

            let smokeX2 = carrierX +
                drift + turbulence

            let smokeY2 = carrierY - 25 - rise

            let smokePoint = projectMissionPoint(
                smokeX2,
                smokeY2,
                carrierZ
            )

            if (smokePoint.length > 0) {

                let sx4 = Math.round(smokePoint[0])
                let sy4 = Math.round(smokePoint[1])

                let smokeScale =
                    focalLength / smokePoint[2]

                let smokeRadius = Math.max(
                    1,
                    Math.min(
                        22,
                        (12 + rise * 0.09) * smokeScale
                    )
                )

                let smokeColor = 3

                if (smokeAge2 > 50) {
                    smokeColor = 10
                }

                if (smokeAge2 > 110) {
                    smokeColor = 12
                }

                terrain.fillCircle(
                    sx4, sy4,
                    Math.max(1, Math.round(smokeRadius)),
                    smokeColor
                )

                terrain.fillCircle(
                    Math.round(sx4 - smokeRadius * 0.7),
                    Math.round(sy4 - smokeRadius * 0.4),
                    Math.max(1, Math.round(smokeRadius * 0.65)),
                    smokeColor
                )

                terrain.fillCircle(
                    Math.round(sx4 + smokeRadius * 0.6),
                    Math.round(sy4 + smokeRadius * 0.3),
                    Math.max(1, Math.round(smokeRadius * 0.55)),
                    smokeColor
                )
            }
        }
    }
firePoint = projectMissionPoint(carrierX, carrierY - 30, carrierZ)
    if (firePoint.length == 0) {
        return
    }
    fx2 = Math.round(firePoint[0])
    fy2 = Math.round(firePoint[1])
    fireScale = focalLength / firePoint[2]
    contraction = Math.max(0, Math.min(1, (explosionTime - 10) / 65))
    flameGrowth = Math.max(0, Math.min(1, (explosionTime - 25) / 50))
    if (flameGrowth > 0) {
        for (let flame = 0; flame <= 4; flame++) {
            flameX = fx2 + (flame - 2) * 20 * fireScale
            flicker = 65 + Math.sin(explosionTime * 0.3 + flame * 2) * 25
            flameHeight = flicker * fireScale * flameGrowth
            flameWidth = 15 * fireScale * flameGrowth
            fillTriangle(flameX - flameWidth, fy2, flameX + flameWidth, fy2, flameX, fy2 - flameHeight, 4)
            fillTriangle(flameX - flameWidth / 2, fy2, flameX + flameWidth / 2, fy2, flameX, fy2 - flameHeight * 0.65, 5)
        }
    }
    if (contraction < 1) {
        remaining = 1 - contraction
        fireSize = 240 * remaining * remaining
        radius2 = Math.min(65, Math.round(fireSize * fireScale))
        fireballY = Math.round(fy2 - 25 * fireScale * remaining)
        if (radius2 >= 1) {
            terrain.fillCircle(
                fx2, fireballY, radius2, 4
            )
terrain.fillCircle(
                fx2, fireballY,
                Math.max(1, Math.round(radius2 * 0.65)),
                5
            )
if (explosionTime < 20) {
                whiteRadius = Math.round(radius2 * 0.4 * (1 - explosionTime / 20))
                if (whiteRadius >= 1) {
                    terrain.fillCircle(
                        fx2, fireballY, whiteRadius, 1
                    )
                }
            }
        }
    }
}
function drawBankingEnemy (cx: number, cy: number, scale: number, roll: number) {
    cosine2 = Math.cos(roll)
    sine2 = Math.sin(roll)
    a = Math.max(1, Math.round(enemyImage.width * scale))
    o = Math.max(1, Math.round(enemyImage.height * scale))
    radius3 = Math.ceil(Math.sqrt(a * a + o * o) / 2)
    for (let dx3 = -radius3; dx3 <= radius3; dx3++) {

        for (let dy3 = -radius3; dy3 <= radius3; dy3++) {

            let sx5 = Math.floor(
                (dx3 * cosine2 + dy3 * sine2 + a / 2)
                * enemyImage.width / a
            )

            let sy5 = Math.floor(
                (-dx3 * sine2 + dy3 * cosine2 + o / 2)
                * enemyImage.height / o
            )

            if (
                sx5 >= 0 && sx5 < enemyImage.width &&
                sy5 >= 0 && sy5 < enemyImage.height
            ) {

                let pixel = enemyImage.getPixel(sx5, sy5)

                let screenX = Math.round(cx + dx3)
                let screenY = Math.round(cy + dy3)

                if (
                    pixel != 0 &&
                    screenX >= 0 && screenX < 240 &&
                    screenY >= 0 && screenY < 180
                ) {

                    terrain.setPixel(
                        screenX, screenY, pixel
                    )
                }
            }
        }
    }
}
function renderCarrier () {
    if (!(bombingActive) || carrierZ <= 0) {
        return
    }
    point = projectMissionPoint(carrierX, carrierY, carrierZ)
    if (point.length == 0) {
        return
    }
    sx3 = point[0]
    sy3 = point[1]
    s = Math.min(2, 900 / point[2])
    fillQuad(sx3 - 48 * s, sy3, sx3 + 48 * s, sy3, sx3 + 38 * s, sy3 + 9 * s, sx3 - 38 * s, sy3 + 9 * s, 3)
    fillQuad(sx3 - 52 * s, sy3, sx3 - 39 * s, sy3 - 10 * s, sx3 + 39 * s, sy3 - 10 * s, sx3 + 52 * s, sy3, 11)
    terrain.drawLine(Math.round(sx3 - 52 * s), Math.round(sy3), Math.round(sx3 + 52 * s), Math.round(sy3), 10)
    for (let mark = -4; mark <= 4; mark++) {

        terrain.drawLine(
            Math.round(sx3 + mark * 9 * s),
            Math.round(sy3 - 5 * s),
            Math.round(sx3 + (mark * 9 + 5) * s),
            Math.round(sy3 - 5 * s),
            1
        )
    }
fillQuad(sx3 + 20 * s, sy3 - 7 * s, sx3 + 20 * s, sy3 - 21 * s, sx3 + 31 * s, sy3 - 21 * s, sx3 + 31 * s, sy3 - 7 * s, 6)
    terrain.drawLine(Math.round(sx3 + 26 * s), Math.round(sy3 - 21 * s), Math.round(sx3 + 26 * s), Math.round(sy3 - 28 * s), 3)
}
function getViewYaw () {
    return cameraYaw + aircraftYaw
}
function updateFiring () {
    shotThisFrame = false
    fireTimer += 33
    if (firing && !(gunsBlocked) && fireTimer >= fireInterval) {
        fireGuns()
        fireTimer = 0
    }
    gunRecoil *= 0.65
}
function drawScaledCloud (targetX: number, targetY: number, cloudScale: number) {
    cloudWidth = Math.max(1, Math.round(cloudImage.width * cloudScale))
    cloudHeight = Math.max(1, Math.round(cloudImage.height * cloudScale))
    for (let px = 0; px <= cloudWidth - 1; px++) {
        for (let py = 0; py <= cloudHeight - 1; py++) {
            sourceX = Math.floor(px * cloudImage.width / cloudWidth)
            sourceY = Math.floor(py * cloudImage.height / cloudHeight)
            pixelColor = cloudImage.getPixel(sourceX, sourceY)
            pixelX = Math.round(targetX + px - cloudWidth / 2)
            pixelY = Math.round(targetY + py - cloudHeight / 2)
            localHorizon = getHorizon(pixelX)
            if (pixelColor != 0 && pixelX >= 0 && pixelX < 240 && pixelY >= 0 && pixelY < 180 && pixelY < localHorizon) {
                terrain.setPixel(pixelX, pixelY, pixelColor)
            }
        }
    }
}
function renderCrashSmoke () {
    yaw = getViewYaw() * Math.PI / 180
    pitch = (0 - Math.max(-80, Math.min(80, getViewPitch()))) * Math.PI / 180
    cyaw = Math.cos(yaw)
    syaw = Math.sin(yaw)
    cpitch = Math.cos(pitch)
    spitch = Math.sin(pitch)
    for (let j = smokeAge.length - 1; j >= 0; j--) {
        smokeAge[j] += 1
        smokeZ[j] += speed / 200 * cloudTravelSpeed
        smokeY[j] -= 0.5
        if (smokeAge[j] > 75) {
            smokeX.removeAt(j)
            smokeY.removeAt(j)
            smokeZ.removeAt(j)
            smokeAge.removeAt(j)
        } else {
            let rx = smokeX[j] * cyaw - smokeZ[j] * syaw
            let rz = smokeX[j] * syaw + smokeZ[j] * cyaw
            let ry = smokeY[j] * cpitch - rz * spitch
            let depth = smokeY[j] * spitch + rz * cpitch
            if (depth > 100) {
                let x = 120 + rx * focalLength / depth
                let y = 90 + ry * focalLength / depth + tilt * (x - 120) / 120
                let r = Math.max(1, Math.min(9, Math.round((18 + smokeAge[j] * 0.8) * focalLength / depth)))
                let d = 3
                if (smokeAge[j] > 25) d = 10
                if (smokeAge[j] > 50) d = 12
                if (x > -10 && x < 250 && y > -10 && y < 190) {
                    terrain.fillCircle(Math.round(x), Math.round(y), r, d)
                }
            }
        }
    }
}
function renderEnemies () {
    yawRadians2 = getViewYaw() * Math.PI / 180
    pitchRadians2 = (0 - Math.max(-80, Math.min(80, getViewPitch()))) * Math.PI / 180
    cosYaw2 = Math.cos(yawRadians2)
    sinYaw2 = Math.sin(yawRadians2)
    cosPitch2 = Math.cos(pitchRadians2)
    sinPitch2 = Math.sin(pitchRadians2)
    hitEnemy = -1
    nearestHitDepth = 1000000
    for (let enemyIndex2 = 0; enemyIndex2 <= enemyCount - 1; enemyIndex2++) {
        rotatedX2 = enemyX[enemyIndex2] * cosYaw2 - enemyZ[enemyIndex2] * sinYaw2
        rotatedZ2 = enemyX[enemyIndex2] * sinYaw2 + enemyZ[enemyIndex2] * cosYaw2
        rotatedY2 = enemyY[enemyIndex2] * cosPitch2 - rotatedZ2 * sinPitch2
        enemyDepth = enemyY[enemyIndex2] * sinPitch2 + rotatedZ2 * cosPitch2
        if (enemyDepth > 100) {
            projectedX2 = rotatedX2 * focalLength / enemyDepth
            projectedY2 = rotatedY2 * focalLength / enemyDepth
            enemyScreenX = 120 + projectedX2
            enemyScreenY = 90 + projectedY2
            enemyScreenY += tilt * projectedX2 / 120
            enemyScale = enemySize / enemyDepth * 3
            enemyScale = Math.min(3, enemyScale)
            hitWidth = enemyImage.width * enemyScale / 2
            hitHeight = enemyImage.height * enemyScale / 2
            if (enemyHealth[enemyIndex2] > 0 && shotThisFrame && Math.abs(120 + gunSwayX - enemyScreenX) < hitWidth && Math.abs(90 + gunSwayY - enemyScreenY) < hitHeight && enemyDepth < nearestHitDepth) {
                hitEnemy = enemyIndex2
                nearestHitDepth = enemyDepth
            }
            if (enemyScreenX > -100 && enemyScreenX < 340 && enemyScreenY > -50 && enemyScreenY < 230) {
                if (enemyHealth[enemyIndex2] <= 0) {
                    drawCrashingEnemy(enemyScreenX, enemyScreenY, enemyScale, enemyRoll[enemyIndex2])
                } else {
                    drawBankingEnemy(enemyScreenX, enemyScreenY, enemyScale, enemyRoll[enemyIndex2])
                }
            }
        }
    }
    if (hitEnemy >= 0) {
        enemyHealth[hitEnemy] -= 10
if (enemyHealth[hitEnemy] <= 0) {
            enemiesDestroyed += 1
            enemyCrashTime[hitEnemy] = 0
            enemyCrashDirection[hitEnemy] = randint(0, 1) * 2 - 1
        }
    }
}
function renderGuns () {
    gx = gunSwayX
    gy = gunSwayY + gunRecoil
    fillQuad(85 + gx, 200 + gy, 105 + gx, 146 + gy, 135 + gx, 146 + gy, 155 + gx, 200 + gy, 10)
    for (let gunIndex = 0; gunIndex <= 1; gunIndex++) {
        side = gunIndex * 2 - 1
        rearX = 120 + side * 55 + gx
        middleX = 120 + side * 30 + gx
        frontX = 120 + side * 9 + gx
        fillQuad(middleX - 5, 143 + gy, frontX - 2, 98 + gy, frontX + 2, 98 + gy, middleX + 5, 143 + gy, 10)
        terrain.drawLine(Math.round(middleX - 3), Math.round(143 + gy), Math.round(frontX - 1), Math.round(98 + gy), 11)
        terrain.fillRect(Math.round(frontX - 2), Math.round(96 + gy), 4, 4, 3)
        fillQuad(rearX - 13, 200 + gy, middleX - 6, 137 + gy, middleX + 6, 137 + gy, rearX + 13, 200 + gy, 3)
        fillQuad(rearX - 9, 200 + gy, middleX - 4, 139 + gy, middleX + 3, 139 + gy, rearX + 5, 200 + gy, 10)
        terrain.drawLine(Math.round(rearX - 8), Math.round(200 + gy), Math.round(middleX - 3), Math.round(139 + gy), 11)
    }
    fillQuad(83 + gx, 169 + gy, 157 + gx, 169 + gy, 162 + gx, 178 + gy, 78 + gx, 178 + gy, 12)
}
browserEvents.onMouseMove(function (x, y) {
    mouseX = x
    mouseY = y
    if (mouseInitialized) {
        mouseDeltaX += x - previousMouseX
        mouseDeltaY += previousMouseY - y
    }
    previousMouseX = x
    previousMouseY = y
    mouseInitialized = true
})
function fillTriangle (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, col: number) {
    steps = Math.ceil(Math.max(1, Math.max(Math.abs(x3 - x2), Math.abs(y3 - y2))))
    for (let step = 0; step <= steps; step++) {
        fraction = step / steps
        endX = x2 + (x3 - x2) * fraction
        endY = y2 + (y3 - y2) * fraction
        terrain.drawLine(Math.round(x1), Math.round(y1), Math.round(endX), Math.round(endY), col)
    }
}
function renderCombatHUD () {
    healthPercentage = aircraftHealth / 50
    healthColor = 7
    if (healthPercentage <= 0.3) {
        healthColor = 2
    } else if (healthPercentage <= 0.6) {
        healthColor = 5
    }
    terrain.fillRect(5, 5, 79, 27, 3)
    terrain.print(
        "HP " + aircraftHealth + "/" + 50,
        9, 8, 1
    )
terrain.fillRect(9, 21, 70, 6, 12)
    terrain.fillRect(9, 21, Math.round(70 * healthPercentage), 6, healthColor)
    terrain.fillRect(180, 5, 55, 15, 3)
    terrain.print(
        "Kills " + enemiesDestroyed,
        185, 8, 1
    )
if (damageFlash > 0) {
        terrain.drawRect(0, 0, 240, 180, 2)
        terrain.drawRect(1, 1, 238, 178, 2)
        terrain.drawRect(2, 2, 236, 176, 2)
        damageFlash += 0 - 1
    }
    if (healthPercentage <= 0.3) {
        terrain.print(
            "Low HP",
            70, 35, 2
        )
    }
    if (aircraftHealth <= 0) {
        game.over(false)
    }
}
function updateEnemies () {
    enemyTime += 0.033
    for (let enemyIndex = 0; enemyIndex <= enemyCount - 1; enemyIndex++) {
        if (enemyHealth[enemyIndex] <= 0) {
            enemyCrashTime[enemyIndex] += 1
crashTime = enemyCrashTime[enemyIndex]
            enemyRoll[enemyIndex] += 0.15 * enemyCrashDirection[enemyIndex]
enemyX[enemyIndex] += Math.cos(enemyRoll[enemyIndex]) * 8
enemyY[enemyIndex] += 2 + crashTime * 0.09 + Math.sin(enemyRoll[enemyIndex]) * 1.5
enemyZ[enemyIndex] += 2
if (crashTime % 3 == 0) {
                smokeX.push(enemyX[enemyIndex])
                smokeY.push(enemyY[enemyIndex])
                smokeZ.push(enemyZ[enemyIndex])
                smokeAge.push(0)
            }
            if (crashTime >= 150) {
                spawnEnemy(enemyIndex)
            }
            continue;
        }
        if (enemyBreakingAway[enemyIndex] == 0) {
            enemyZ[enemyIndex] -= enemySpeed[enemyIndex]
enemyX[enemyIndex] += Math.sin(
                enemyTime * 1.2 + enemyPhase[enemyIndex]
            ) * 2
enemyY[enemyIndex] += Math.cos(
                enemyTime * 0.8 + enemyPhase[enemyIndex]
            ) * 0.7
enemyRoll[enemyIndex] = Math.sin(enemyTime * 1.2 + enemyPhase[enemyIndex]) * 0.12
            if (enemyZ[enemyIndex] < 350) {
                enemyBreakingAway[enemyIndex] = 1
                enemyTurnTime[enemyIndex] = 0
            }
        } else {
            enemyTurnTime[enemyIndex] += 1
turnTime = enemyTurnTime[enemyIndex]
            direction = enemyTurnDirection[enemyIndex]
            turnProgress = Math.min(1, turnTime / 30)
            targetBank = direction * 1.3 * turnProgress
            enemyRoll[enemyIndex] += (
                targetBank - enemyRoll[enemyIndex]
            ) * 0.1
enemyX[enemyIndex] +=
                direction * 12 * turnProgress
enemyZ[enemyIndex] -=
                3 * (1 - turnProgress)
enemyY[enemyIndex] -= 0.5 * turnProgress
if (Math.abs(enemyX[enemyIndex]) > 1800) {
                spawnEnemy(enemyIndex)
            }
        }
    }
}
function renderClouds () {
    yawRadians = getViewYaw() * Math.PI / 180
    pitchRadians = (0 - Math.max(-80, Math.min(80, getViewPitch()))) * Math.PI / 180
    cosYaw = Math.cos(yawRadians)
    sinYaw = Math.sin(yawRadians)
    cosPitch = Math.cos(pitchRadians)
    sinPitch = Math.sin(pitchRadians)
    for (let cloudIndex2 = 0; cloudIndex2 <= cloudCount - 1; cloudIndex2++) {
        cloudZ[cloudIndex2] += speed / 200 * cloudTravelSpeed
if (cloudZ[cloudIndex2] > 2200) {
            cloudZ[cloudIndex2] = -2200
            cloudX[cloudIndex2] = randint(-2000, 2000)
            cloudY[cloudIndex2] = randint(-450, -120)
            cloudSize[cloudIndex2] = randint(80, 220)
        }
        rotatedX = cloudX[cloudIndex2] * cosYaw - cloudZ[cloudIndex2] * sinYaw
        rotatedZ = cloudX[cloudIndex2] * sinYaw + cloudZ[cloudIndex2] * cosYaw
        rotatedY = cloudY[cloudIndex2] * cosPitch - rotatedZ * sinPitch
        cloudDepth = cloudY[cloudIndex2] * sinPitch + rotatedZ * cosPitch
        if (cloudDepth > 100) {
            projectedX = rotatedX * focalLength / cloudDepth
            projectedY = rotatedY * focalLength / cloudDepth
            cloudScreenX = 120 + projectedX
            cloudScreenY = 90 + projectedY
            cloudScreenY += tilt * projectedX / 120
            cloudScale = cloudSize[cloudIndex2] / cloudDepth * 3
            cloudScale = Math.min(3, cloudScale)
            if (cloudScreenX > -100 && cloudScreenX < 340 && cloudScreenY > -50 && cloudScreenY < 230) {
                drawScaledCloud(cloudScreenX, cloudScreenY, cloudScale)
            }
        }
    }
}
function updateEnemyBullets () {
    for (let l = enemyBulletZ.length - 1; l >= 0; l--) {

        enemyBulletZ[l] -= 35

        enemyBulletX[l] *= 0.94
        enemyBulletY[l] *= 0.94

        if (enemyBulletZ[l] <= 40) {

            if (randint(1, 100) <= 35) {

                aircraftHealth = Math.max(
                    0,
                    aircraftHealth - randint(4, 7)
                )

                damageFlash = 3
            }

            enemyBulletX.removeAt(l)
            enemyBulletY.removeAt(l)
            enemyBulletZ.removeAt(l)
        }
    }
}
function updateBombingMission () {
    if (bombMessageTimer > 0) {
        bombMessageTimer += 0 - 1
    }
    if (bombingActive) {
        bombingTime += 1
        carrierZ += speed / 200 * 10
        if (bombingTime >= explosionDelay) {
            explosionTime += 1
        }
        if (carrierZ > 12000) {
            bombingActive = false
        }
    }
}
function renderEnemyBullets () {
    yawRadians3 = getViewYaw() * Math.PI / 180
    pitchRadians3 = (0 - Math.max(-80, Math.min(80, getViewPitch()))) * Math.PI / 180
    cosYaw3 = Math.cos(yawRadians3)
    sinYaw3 = Math.sin(yawRadians3)
    cosPitch3 = Math.cos(pitchRadians3)
    sinPitch3 = Math.sin(pitchRadians3)
    for (let m = 0; m <= enemyBulletZ.length - 1; m++) {
        rx2 = enemyBulletX[m] * cosYaw3 - enemyBulletZ[m] * sinYaw3
        rz2 = enemyBulletX[m] * sinYaw3 + enemyBulletZ[m] * cosYaw3
        ry2 = enemyBulletY[m] * cosPitch3 - rz2 * sinPitch3
        bulletDistance = enemyBulletY[m] * sinPitch3 + rz2 * cosPitch3
        if (bulletDistance > 40) {
            bx2 = 120 + rx2 * focalLength / bulletDistance
            by2 = 90 + ry2 * focalLength / bulletDistance
            by2 += tilt * (bx2 - 120) / 120
            bulletSize = Math.max(1, Math.min(5, 300 / bulletDistance))
            terrain.fillRect(Math.round(bx2), Math.round(by2), Math.round(bulletSize), Math.round(bulletSize), 4)
        }
    }
}
function spawnEnemy (enemyIndex: number) {
    enemyX[enemyIndex] = randint(-500, 500)
    enemyY[enemyIndex] = randint(-250, 100)
    enemyZ[enemyIndex] = randint(2500, 4500)
    enemyBreakingAway[enemyIndex] = 0
    enemyTurnTime[enemyIndex] = 0
    enemyTurnDirection[enemyIndex] = randint(0, 1) * 2 - 1
    enemySpeed[enemyIndex] = randint(3, 6)
    enemyPhase[enemyIndex] = randint(0, 628) / 100
    enemyCrashTime[enemyIndex] = 0
    enemyRoll[enemyIndex] = 0
    enemyCrashDirection[enemyIndex] = 1
    enemyHealth[enemyIndex] = 50
    enemyFireTimer[enemyIndex] = randint(200, 1000)
}
function drawScaledEnemy (targetX: number, targetY: number, enemyScale: number) {
    enemyWidth = Math.max(1, Math.round(enemyImage.width * enemyScale))
    enemyHeight = Math.max(1, Math.round(enemyImage.height * enemyScale))
    for (let px2 = 0; px2 <= enemyWidth - 1; px2++) {
        for (let py2 = 0; py2 <= enemyHeight - 1; py2++) {
            sourceX2 = Math.floor(px2 * enemyImage.width / enemyWidth)
            sourceY2 = Math.floor(py2 * enemyImage.height / enemyHeight)
            pixelColor2 = enemyImage.getPixel(sourceX2, sourceY2)
            pixelX2 = Math.round(targetX + px2 - enemyWidth / 2)
            pixelY2 = Math.round(targetY + py2 - enemyHeight / 2)
            if (pixelColor2 != 0 && pixelX2 >= 0 && pixelX2 < 240 && pixelY2 >= 0 && pixelY2 < 180) {
                terrain.setPixel(pixelX2, pixelY2, pixelColor2)
            }
        }
    }
}
function renderBombMessage () {
    if (bombMessageTimer > 0) {
        terrain.fillRect(65, 33, 110, 14, 3)
        terrain.print(
            "BOMB RELEASED",
            81, 36, 5
        )
    }
}
function renderAircraftBody () {
    ox = (0 - cameraYaw) * tailMovementX
    oy = cameraPitch * tailMovementY
    fillQuad(70 + ox, 180 + oy, 170 + ox, 180 + oy, 235 + ox, 280 + oy, 5 + ox, 280 + oy, 6)
    fillQuad(70 + ox, 180 + oy, 91 + ox, 180 + oy, 48 + ox, 280 + oy, 5 + ox, 280 + oy, 11)
    fillQuad(149 + ox, 180 + oy, 170 + ox, 180 + oy, 235 + ox, 280 + oy, 192 + ox, 280 + oy, 10)
    fillQuad(91 + ox, 187 + oy, 149 + ox, 187 + oy, 187 + ox, 280 + oy, 53 + ox, 280 + oy, 3)
    fillQuad(104 + ox, 194 + oy, 136 + ox, 194 + oy, 152 + ox, 239 + oy, 88 + ox, 239 + oy, 10)
    terrain.drawLine(91 + ox, 187 + oy, 53 + ox, 280 + oy, 11)
    terrain.drawLine(149 + ox, 187 + oy, 187 + ox, 280 + oy, 11)
    fillQuad(100 + ox, 247 + oy, 140 + ox, 247 + oy, 146 + ox, 280 + oy, 94 + ox, 280 + oy, 12)
    for (let rivet = 0; rivet <= 5; rivet++) {
        terrain.setPixel(Math.round(77 - rivet * 5 + ox), Math.round(188 + rivet * 13 + oy), 3)
        terrain.setPixel(Math.round(163 + rivet * 5 + ox), Math.round(188 + rivet * 13 + oy), 3)
    }
    fillQuad(117 + ox, 117 + oy, 92 + ox, 102 + oy, 47 + ox, 106 + oy, 40 + ox, 114 + oy, 6)
    fillTriangle(40 + ox, 114 + oy, 117 + ox, 117 + oy, 117 + ox, 128 + oy, 10)
    fillQuad(123 + ox, 117 + oy, 148 + ox, 102 + oy, 193 + ox, 106 + oy, 200 + ox, 114 + oy, 6)
    fillTriangle(200 + ox, 114 + oy, 123 + ox, 117 + oy, 123 + ox, 128 + oy, 10)
    fillQuad(70 + ox, 180 + oy, 114 + ox, 111 + oy, 126 + ox, 111 + oy, 170 + ox, 180 + oy, 6)
    fillQuad(70 + ox, 180 + oy, 114 + ox, 111 + oy, 118 + ox, 111 + oy, 105 + ox, 180 + oy, 11)
    fillQuad(126 + ox, 111 + oy, 170 + ox, 180 + oy, 140 + ox, 180 + oy, 124 + ox, 111 + oy, 10)
    fillQuad(114 + ox, 116 + oy, 115 + ox, 79 + oy, 120 + ox, 55 + oy, 130 + ox, 116 + oy, 6)
    fillQuad(120 + ox, 55 + oy, 126 + ox, 55 + oy, 131 + ox, 65 + oy, 130 + ox, 116 + oy, 10)
    terrain.drawLine(124 + ox, 64 + oy, 124 + ox, 112 + oy, 3)
    terrain.drawLine(91 + ox, 150 + oy, 149 + ox, 150 + oy, 3)
    terrain.drawLine(80 + ox, 168 + oy, 160 + ox, 168 + oy, 3)
    for (let rivet2 = 0; rivet2 <= 6; rivet2++) {
        terrain.setPixel(Math.round(95 + rivet2 * 8 + ox), Math.round(153 + oy), 3)
    }
}
function updateEnemyFiring () {
    for (let k = 0; k <= enemyCount - 1; k++) {
        if (enemyHealth[k] > 0 && enemyBreakingAway[k] == 0) {
            enemyFireTimer[k] -= 33
if (enemyZ[k] < 900 && enemyZ[k] > 180 && enemyFireTimer[k] <= 0) {
                enemyBulletX.push(enemyX[k])
                enemyBulletY.push(enemyY[k])
                enemyBulletZ.push(enemyZ[k])
                enemyFireTimer[k] = randint(200, 800)
            }
        }
    }
}
let waveWidth = 0
let waveY = 0
let waveDistance = 0
let waveDepth = 0
let waveX = 0
let travel = 0
let y2 = 0
let horizon = 0
let edgeY = 0
let edgeX = 0
let oy = 0
let ox = 0
let pixelY2 = 0
let pixelX2 = 0
let pixelColor2 = 0
let sourceY2 = 0
let sourceX2 = 0
let enemyHeight = 0
let enemyWidth = 0
let bulletSize = 0
let by2 = 0
let bx2 = 0
let bulletDistance = 0
let ry2 = 0
let rz2 = 0
let rx2 = 0
let sinPitch3 = 0
let cosPitch3 = 0
let sinYaw3 = 0
let cosYaw3 = 0
let pitchRadians3 = 0
let yawRadians3 = 0
let cloudScale = 0
let cloudScreenY = 0
let cloudScreenX = 0
let projectedY = 0
let projectedX = 0
let cloudDepth = 0
let rotatedY = 0
let rotatedZ = 0
let rotatedX = 0
let sinPitch = 0
let cosPitch = 0
let sinYaw = 0
let cosYaw = 0
let pitchRadians = 0
let yawRadians = 0
let targetBank = 0
let turnProgress = 0
let enemyTurnDirection: number[] = []
let direction = 0
let turnTime = 0
let enemyBreakingAway: number[] = []
let crashTime = 0
let healthColor = 0
let healthPercentage = 0
let endY = 0
let endX = 0
let fraction = 0
let steps = 0
let mouseDeltaY = 0
let mouseDeltaX = 0
let mouseInitialized = false
let frontX = 0
let middleX = 0
let rearX = 0
let side = 0
let gy = 0
let gx = 0
let hitHeight = 0
let hitWidth = 0
let enemyScale = 0
let enemyScreenY = 0
let enemyScreenX = 0
let projectedY2 = 0
let projectedX2 = 0
let enemyDepth = 0
let rotatedY2 = 0
let rotatedZ2 = 0
let rotatedX2 = 0
let nearestHitDepth = 0
let hitEnemy = 0
let sinPitch2 = 0
let cosPitch2 = 0
let sinYaw2 = 0
let cosYaw2 = 0
let pitchRadians2 = 0
let yawRadians2 = 0
let spitch = 0
let cpitch = 0
let syaw = 0
let cyaw = 0
let pitch = 0
let yaw = 0
let localHorizon = 0
let pixelY = 0
let pixelX = 0
let pixelColor = 0
let sourceY = 0
let sourceX = 0
let cloudHeight = 0
let cloudWidth = 0
let firing = false
let fireTimer = 0
let cameraYaw = 0
let s = 0
let sy3 = 0
let sx3 = 0
let point: number[] = []
let radius3 = 0
let o = 0
let a = 0
let sine2 = 0
let cosine2 = 0
let whiteRadius = 0
let fireballY = 0
let radius2 = 0
let fireSize = 0
let remaining = 0
let flameWidth = 0
let flameHeight = 0
let flicker = 0
let flameX = 0
let flameGrowth = 0
let contraction = 0
let fireScale = 0
let fy2 = 0
let fx2 = 0
let firePoint: number[] = []
let sy2 = 0
let sx2 = 0
let pointDepth = 0
let ry3 = 0
let rz3 = 0
let rx3 = 0
let pitch2 = 0
let yaw2 = 0
let sightY = 0
let sightX = 0
let shotThisFrame = false
let side2 = 0
let aimY = 0
let aimX = 0
let background: Image = null
let gunSwayY = 0
let fy = 0
let gunSwayX = 0
let fx = 0
let side3 = 0
let muzzleFlash = 0
let aircraftYaw = 0
let aircraftRoll = 0
let bombMessageTimer = 0
let bombingTime = 0
let bombingActive = false
let bombReleased = false
let targetYaw = 0
let targetPitch = 0
let targetRoll = 0
let pilotState = 0
let enemyNearby = false
let pilotTimer = 0
let aircraftPitch = 0
let cameraPitch = 0
let updown = 0
let flameSize = 0
let radius = 0
let h = 0
let w = 0
let sine = 0
let cosine = 0
let cloudSize: number[] = []
let cloudY: number[] = []
let cloudX: number[] = []
let spawnDistance = 0
let spawnAngle = 0
let enemyImage: Image = null
let cloudImage: Image = null
let aircraftHealth = 0
let enemySize = 0
let enemyCount = 0
let fireInterval = 0
let gunWeight = 0
let tailMovementY = 0
let tailMovementX = 0
let cloudCount = 0
let previousMouseY = 0
let previousMouseX = 0
let mouseY = 0
let mouseX = 0
let focalLength = 0
let targetSpeed = 0
let cruiseSpeed = 0
let pilotResponsiveness = 0
let maneuverDirection = 0
let nextManeuver = 0
let explosionDelay = 0
let carrierZ = 0
let carrierY = 0
let carrierX = 0
let aircraftLayer: Image = null
let terrain: Image = null
let speed = 0
let enemyBulletZ: number[] = []
let enemyBulletY: number[] = []
let enemyBulletX: number[] = []
let enemiesDestroyed = 0
let damageFlash = 0
let enemyTime = 0
let enemyFireTimer: number[] = []
let smokeAge: number[] = []
let smokeZ: number[] = []
let smokeY: number[] = []
let smokeX: number[] = []
let enemyCrashDirection: number[] = []
let enemyRoll: number[] = []
let enemyCrashTime: number[] = []
let enemyHealth: number[] = []
let enemyPhase: number[] = []
let enemySpeed: number[] = []
let enemyZ: number[] = []
let enemyY: number[] = []
let enemyX: number[] = []
let bulletPitch: number[] = []
let bulletYaw: number[] = []
let bulletDepth: number[] = []
let bulletY: number[] = []
let bulletX: number[] = []
let gunsBlocked = false
let gunRecoil = 0
let cloudZ: number[] = []
let cameraVelocityY = 0
let cameraVelocityX = 0
let explosionTime = 0
let enemyTurnTime: number[] = []
let tilt = 0
namespace userconfig {
    export const ARCADE_SCREEN_WIDTH = 240
    export const ARCADE_SCREEN_HEIGHT = 180
}
speed = 200
terrain = image.create(240, 180)
aircraftLayer = image.create(240, 180)
carrierX = 160
carrierY = 400
carrierZ = -80
explosionDelay = 8
nextManeuver = randint(15000, 30000)
maneuverDirection = 1
pilotResponsiveness = 0.035
cruiseSpeed = 200
targetSpeed = 200
focalLength = 120
mouseX = 120
mouseY = 90
previousMouseX = 120
previousMouseY = 90
let mouseSensitivity = 0.15
let cameraFriction = 0.6
let mouseAcceleration = 0.008
let edgeMargin = 30
let edgeTurnSpeed = 1.2
cloudCount = 80
let cloudTravelSpeed = 1.5
tailMovementX = 2.6
tailMovementY = 2.3
gunWeight = 0.15
fireInterval = 100
enemyCount = 1
enemySize = 180
aircraftHealth = 50
cloudImage = img`
    ................................
    .............11111..............
    ...........111111111............
    ......1111111111111111..........
    ....111111111111111111111.......
    ...111111111111111111111111.....
    .1111111111111111111111111111...
    111111111111111111111111111111..
    1111111111111111111111111111111.
    .11111111111111111111111111111..
    ..dddd11111111dddd111111dddd....
    ....dddddddddddddddddddddd......
    ................................
    `
enemyImage = img`
    .................................
    ...............333...............
    ...............3b3...............
    ..............33b33..............
    ..............33333..............
    .............3366633.............
    ...333333333333333333333333333...
    ..336666666666333336666666666633.
    333333333333333333333333333333333
    ..33333333333333333333333333333..
    .............3aaa3...............
    ..............3a3................
    ...........333333333.............
    ..............333................
    .................................
    `
scene.setBackgroundImage(terrain)
for (let index = 0; index < cloudCount; index++) {
    spawnAngle = randint(0, 359) * Math.PI / 180
    spawnDistance = randint(200, 2000)
    cloudX.push(Math.sin(spawnAngle) * spawnDistance)
    cloudZ.push(Math.cos(spawnAngle) * spawnDistance)
    cloudY.push(randint(-450, -120))
    cloudSize.push(randint(80, 220))
}
for (let enemyIndex3 = 0; enemyIndex3 <= enemyCount - 1; enemyIndex3++) {
    enemyX.push(0)
    enemyY.push(0)
    enemyZ.push(0)
    enemySpeed.push(0)
    enemyPhase.push(0)
    enemyHealth.push(0)
    enemyCrashTime.push(0)
    enemyRoll.push(0)
    enemyCrashDirection.push(1)
    enemyFireTimer.push(0)
    spawnEnemy(enemyIndex3)
}
game.onUpdate(function () {
    cameraVelocityX += mouseDeltaX * (mouseSensitivity + Math.abs(mouseDeltaX) * mouseAcceleration)
    cameraVelocityY += mouseDeltaY * (mouseSensitivity + Math.abs(mouseDeltaY) * mouseAcceleration)
    cameraVelocityX = Math.max(-6, Math.min(6, cameraVelocityX))
    cameraVelocityY = Math.max(-6, Math.min(6, cameraVelocityY))
    if (mouseInitialized) {
        if (mouseX < edgeMargin) {
            edgeX = (0 - (edgeMargin - mouseX)) / edgeMargin
        }
        if (mouseX > 240 - edgeMargin) {
            edgeX = (mouseX - (240 - edgeMargin)) / edgeMargin
        }
        if (mouseY < edgeMargin) {
            edgeY = (edgeMargin - mouseY) / edgeMargin
        }
        if (mouseY > 180 - edgeMargin) {
            edgeY = (0 - (mouseY - (180 - edgeMargin))) / edgeMargin
        }
    }
    edgeX = Math.max(-1, Math.min(1, edgeX))
    edgeY = Math.max(-1, Math.min(1, edgeY))
    edgeX = edgeX * Math.abs(edgeX)
    edgeY = edgeY * Math.abs(edgeY)
    cameraYaw += cameraVelocityX + edgeX * edgeTurnSpeed
    cameraPitch += cameraVelocityY + edgeY * edgeTurnSpeed
    cameraYaw = Math.max(-80, Math.min(80, cameraYaw))
    cameraPitch = Math.max(-45, Math.min(45, cameraPitch))
    cameraVelocityX *= cameraFriction
cameraVelocityY *= cameraFriction
mouseDeltaX = 0
    mouseDeltaY = 0
    updown = focalLength * Math.tan(cameraPitch * Math.PI / 180)
})
forever(function () {
    if (browserEvents.MouseLeft.isPressed()) {
        firing = true
    } else {
        firing = false
    }
    pause(10)
})
game.onUpdateInterval(33, function () {
    terrain.fill(9)
    for (let x2 = 0; x2 <= 239; x2++) {
        horizon = getHorizon(x2)
        if (horizon < 180) {
            terrain.drawLine(x2, Math.max(0, horizon), x2, 179, 8)
        }
        for (let e = 0; e <= 23; e++) {
            y2 = horizon + e
            if (y2 >= 0 && y2 < 180) {
                if (e < 5) {
                    if ((x2 + e) % 2 == 0) {
                        terrain.setPixel(x2, y2, 9)
                    }
                } else if (e < 13) {
                    if (x2 % 2 == 0 && e % 2 == 0) {
                        terrain.setPixel(x2, y2, 9)
                    }
                } else {
                    if (x2 % 4 == 0 && e % 4 == 0) {
                        terrain.setPixel(x2, y2, 9)
                    }
                }
            }
        }
    }
    travel += speed / 200
    travel = travel % 100
    for (let waveIndex = 0; waveIndex <= 79; waveIndex++) {
        waveX = (waveIndex * 73 + 31 - getViewYaw() * 2 + 480) % 240
        waveDepth = (waveIndex * 37 + 100 - travel) % 100 / 100
        waveDistance = 180 * waveDepth * waveDepth
        waveY = getHorizon(waveX) + waveDistance
        if (waveDistance > 24) {
            waveWidth = 1 + waveDepth * waveDepth * 12
            terrain.drawLine(Math.round(waveX), Math.round(waveY), Math.round(waveX + waveWidth), Math.round(waveY + tilt * waveWidth / 120), 6)
        }
    }
    updatePilotAI()
    updateBombingMission()
    renderClouds()
    renderCarrier()
    renderCarrierExplosion()
    updateGunObstruction()
    updateFiring()
    updateEnemies()
    updateEnemyFiring()
    updateEnemyBullets()
    renderEnemies()
    renderEnemyBullets()
    renderBullets()
    renderAircraftBody()
    renderGuns()
    renderMuzzleFlash()
    renderSight()
    renderCombatHUD()
    renderCombatHUD()
    renderBombMessage()
})
