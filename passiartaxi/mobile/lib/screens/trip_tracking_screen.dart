import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/ride_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/passiart_map.dart';
import '../widgets/passiar_widgets.dart';

class TripTrackingScreen extends StatefulWidget {
  const TripTrackingScreen({super.key});

  @override
  State<TripTrackingScreen> createState() => _TripTrackingScreenState();
}

class _TripTrackingScreenState extends State<TripTrackingScreen> {
  Timer? _pollTimer;
  double _driverProgress = 0.3;

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(const Duration(seconds: 2), (_) async {
      if (!mounted) return;
      await context.read<RideProvider>().refreshTracking();
      setState(() {
        _driverProgress = (_driverProgress + 0.05).clamp(0.0, 1.0);
      });
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RideProvider>();
    final ride = provider.activeRide;
    final tracking = provider.tracking;
    final driver = tracking?.driver ?? ride?.driver;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const PassiarAppBar(title: 'Trip tracking'),
      body: Stack(
        children: [
          PassiarMap(
            showRoute: true,
            showDriver: true,
            driverProgress: _driverProgress,
          ),
          SafeArea(
            child: Column(
              children: [
                const Spacer(),
                _DriverSheet(
                  status: tracking?.status ?? ride?.status ?? 'EnRouteToPickup',
                  driverName: driver?.name ?? 'Linh Nguyen',
                  vehicle: driver?.vehicle ?? 'Lamborghini • Aventador',
                  licensePlate: driver?.licensePlate ?? 'DV-557HA',
                  rating: driver?.rating ?? 5.0,
                  eta: tracking?.etaMinutes ?? 4,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DriverSheet extends StatelessWidget {
  final String status;
  final String driverName;
  final String vehicle;
  final String licensePlate;
  final double rating;
  final int eta;

  const _DriverSheet({
    required this.status,
    required this.driverName,
    required this.vehicle,
    required this.licensePlate,
    required this.rating,
    required this.eta,
  });

  String get _statusMessage {
    return switch (status) {
      'Searching' => 'Finding your driver...',
      'Matched' => 'Driver matched!',
      'EnRouteToPickup' => 'Your driver is coming',
      'InTrip' => 'Enjoy your ride',
      'Completed' => 'Trip completed',
      _ => 'Your driver is coming',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _statusMessage,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                      ),
                    ),
                    if (eta > 0)
                      Text(
                        'ETA: $eta min',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                  ],
                ),
              ),
              _DriverAvatar(rating: rating),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            driverName,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          Text(
            vehicle,
            style: TextStyle(color: AppColors.textSecondary),
          ),
          Text(
            licensePlate,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.chat_bubble_outline),
                  label: const Text('Message'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.phone),
                  label: const Text('Call now'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DriverAvatar extends StatelessWidget {
  final double rating;

  const _DriverAvatar({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        CircleAvatar(
          radius: 32,
          backgroundColor: AppColors.primaryYellow.withValues(alpha: 0.3),
          child: const Icon(Icons.person, size: 36, color: AppColors.textPrimary),
        ),
        Positioned(
          bottom: -4,
          right: -4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.favorite, color: Colors.red, size: 12),
                const SizedBox(width: 2),
                Text(
                  rating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
