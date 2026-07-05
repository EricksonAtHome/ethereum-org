import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/ride_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/passiart_map.dart';
import '../widgets/passiar_widgets.dart';
import 'trip_tracking_screen.dart';

class RideSelectionScreen extends StatefulWidget {
  const RideSelectionScreen({super.key});

  @override
  State<RideSelectionScreen> createState() => _RideSelectionScreenState();
}

class _RideSelectionScreenState extends State<RideSelectionScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RideProvider>().loadRideOptions();
    });
  }

  Future<void> _bookRide() async {
    final provider = context.read<RideProvider>();
    final ride = await provider.bookRide();
    if (!mounted) return;

    if (ride != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const TripTrackingScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Booking failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RideProvider>();
    final total = provider.pricing?.total ?? 4.0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: PassiarAppBar(
        title: 'Choose ride',
        onBack: () => Navigator.of(context).pop(),
      ),
      body: Stack(
        children: [
          const PassiarMap(showRoute: true),
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: kToolbarHeight + 8),
                const Spacer(),
                _BottomPanel(
                  provider: provider,
                  total: total,
                  onBook: provider.isLoading ? null : _bookRide,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomPanel extends StatelessWidget {
  final RideProvider provider;
  final double total;
  final VoidCallback? onBook;

  const _BottomPanel({
    required this.provider,
    required this.total,
    this.onBook,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 20,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Choose your ride',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 130,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: provider.rideOptions.length,
              itemBuilder: (context, index) {
                final option = provider.rideOptions[index];
                return RideOptionCard(
                  name: option.name,
                  price: option.basePrice,
                  vehicleType: option.vehicleType,
                  isSelected: provider.selectedRideType == option.id,
                  onTap: () => provider.selectRideType(option.id),
                );
              },
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Payment method',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              PaymentMethodCard(
                label: 'Cash',
                icon: Icons.payments_outlined,
                iconColor: AppColors.greenCash,
                price: provider.pricing?.ridePrice ?? 4.0,
                isSelected: provider.selectedPayment == 'cash',
                onTap: () => provider.selectPayment('cash'),
              ),
              const SizedBox(width: 12),
              PaymentMethodCard(
                label: 'Credit card',
                icon: Icons.credit_card,
                iconColor: AppColors.textPrimary,
                price: provider.pricing?.total ?? 49.0,
                isSelected: provider.selectedPayment == 'credit_card',
                onTap: () => provider.selectPayment('credit_card'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onBook,
              child: provider.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text('Book a ride • \$${total.toStringAsFixed(2)}'),
            ),
          ),
        ],
      ),
    );
  }
}
