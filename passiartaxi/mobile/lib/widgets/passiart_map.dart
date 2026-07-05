import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class PassiarMap extends StatelessWidget {
  final bool showRoute;
  final bool showDriver;
  final double driverProgress;

  const PassiarMap({
    super.key,
    this.showRoute = false,
    this.showDriver = false,
    this.driverProgress = 0.5,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _MapPainter(
        showRoute: showRoute,
        showDriver: showDriver,
        driverProgress: driverProgress,
      ),
      child: const SizedBox.expand(),
    );
  }
}

class _MapPainter extends CustomPainter {
  final bool showRoute;
  final bool showDriver;
  final double driverProgress;

  _MapPainter({
    required this.showRoute,
    required this.showDriver,
    required this.driverProgress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    _drawBackground(canvas, size);
    _drawParks(canvas, size);
    _drawRoads(canvas, size);
    if (showRoute) _drawRoute(canvas, size);
    _drawDestinationPin(canvas, size);
    if (showDriver) _drawDriver(canvas, size);
  }

  void _drawBackground(Canvas canvas, Size size) {
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = const Color(0xFFFAFAFA),
    );
  }

  void _drawParks(Canvas canvas, Size size) {
    final parkPaint = Paint()..color = AppColors.mapGreen.withValues(alpha: 0.6);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.05, size.height * 0.15, size.width * 0.35, size.height * 0.25),
        const Radius.circular(12),
      ),
      parkPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.55, size.height * 0.05, size.width * 0.3, size.height * 0.2),
        const Radius.circular(12),
      ),
      parkPaint,
    );
  }

  void _drawRoads(Canvas canvas, Size size) {
    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 18
      ..strokeCap = StrokeCap.round;

    final path = Path()
      ..moveTo(size.width * 0.1, size.height * 0.7)
      ..quadraticBezierTo(size.width * 0.4, size.height * 0.5, size.width * 0.7, size.height * 0.35)
      ..quadraticBezierTo(size.width * 0.85, size.height * 0.25, size.width * 0.9, size.height * 0.15);

    canvas.drawPath(path, roadPaint);

    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.8)
      ..strokeWidth = 8;

    canvas.drawLine(
      Offset(size.width * 0.2, size.height * 0.1),
      Offset(size.width * 0.2, size.height * 0.9),
      gridPaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.1),
      Offset(size.width * 0.5, size.height * 0.9),
      gridPaint,
    );
  }

  void _drawRoute(Canvas canvas, Size size) {
    final routePath = Path()
      ..moveTo(size.width * 0.15, size.height * 0.75)
      ..quadraticBezierTo(size.width * 0.45, size.height * 0.55, size.width * 0.75, size.height * 0.3);

    final dashedPaint = Paint()
      ..color = AppColors.primaryYellow
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;

    _drawDashedPath(canvas, routePath, dashedPaint, 8, 6);

    if (showDriver) {
      final traveledPaint = Paint()
        ..color = AppColors.routeBlue
        ..strokeWidth = 4
        ..style = PaintingStyle.stroke;

      final metrics = routePath.computeMetrics().first;
      final traveledPath = metrics.extractPath(0, metrics.length * driverProgress * 0.6);
      canvas.drawPath(traveledPath, traveledPaint);
    }
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint, double dash, double gap) {
    for (final metric in path.computeMetrics()) {
      double distance = 0;
      while (distance < metric.length) {
        final next = math.min(distance + dash, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance += dash + gap;
      }
    }
  }

  void _drawDestinationPin(Canvas canvas, Size size) {
    final pinCenter = Offset(size.width * 0.78, size.height * 0.28);
    canvas.drawCircle(
      pinCenter,
      14,
      Paint()..color = AppColors.orangePin.withValues(alpha: 0.3),
    );
    canvas.drawCircle(pinCenter, 8, Paint()..color = AppColors.orangePin);
    canvas.drawCircle(pinCenter, 3, Paint()..color = Colors.white);
  }

  void _drawDriver(Canvas canvas, Size size) {
    final driverPos = Offset(
      size.width * (0.15 + 0.55 * driverProgress),
      size.height * (0.75 - 0.4 * driverProgress),
    );

    canvas.drawCircle(
      driverPos,
      18,
      Paint()..color = AppColors.primaryYellow.withValues(alpha: 0.3),
    );

    final carRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: driverPos, width: 24, height: 14),
      const Radius.circular(4),
    );
    canvas.drawRRect(carRect, Paint()..color = AppColors.primaryYellow);
  }

  @override
  bool shouldRepaint(covariant _MapPainter oldDelegate) {
    return oldDelegate.showRoute != showRoute ||
        oldDelegate.showDriver != showDriver ||
        oldDelegate.driverProgress != driverProgress;
  }
}
