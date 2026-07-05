import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class PassiarAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback? onBack;

  const PassiarAppBar({
    super.key,
    required this.title,
    this.onBack,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(Icons.arrow_back_ios_new, size: 16),
        ),
        onPressed: onBack ?? () => Navigator.of(context).maybePop(),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
      ),
      actions: [
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.grid_view_rounded, size: 18),
          ),
          onPressed: () {},
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}

class LocationInputCard extends StatelessWidget {
  final String pickupAddress;
  final String destinationAddress;
  final VoidCallback? onAddStop;

  const LocationInputCard({
    super.key,
    required this.pickupAddress,
    required this.destinationAddress,
    this.onAddStop,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardWhite,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryYellow,
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  width: 2,
                  height: 30,
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: CustomPaint(painter: _DashedLinePainter()),
                ),
                const Icon(Icons.location_on, color: AppColors.orangePin, size: 18),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pickupAddress,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  destinationAddress,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.dividerGrey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.add, size: 16),
            ),
            onPressed: onAddStop,
          ),
        ],
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.dividerGrey
      ..strokeWidth = 2;
    double y = 0;
    while (y < size.height) {
      canvas.drawLine(Offset(size.width / 2, y), Offset(size.width / 2, y + 4), paint);
      y += 8;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class RideOptionCard extends StatelessWidget {
  final String name;
  final double price;
  final String vehicleType;
  final bool isSelected;
  final VoidCallback onTap;

  const RideOptionCard({
    super.key,
    required this.name,
    required this.price,
    required this.vehicleType,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 130,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primaryYellow : AppColors.dividerGrey,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primaryYellow.withValues(alpha: 0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CarIllustration(type: vehicleType),
            const SizedBox(height: 8),
            Text(
              name,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              '\$${price.toStringAsFixed(2)}',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CarIllustration extends StatelessWidget {
  final String type;

  const _CarIllustration({required this.type});

  @override
  Widget build(BuildContext context) {
    final isSuv = type == 'suv';
    final isTaxi = type == 'taxi';
    final color = isTaxi ? Colors.white : AppColors.primaryYellow;

    return SizedBox(
      height: 50,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: isSuv ? 70 : 60,
            height: isSuv ? 28 : 22,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(8),
              border: isTaxi
                  ? Border.all(color: AppColors.dividerGrey, width: 1)
                  : null,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
          ),
          Positioned(
            top: 8,
            child: Container(
              width: isSuv ? 40 : 32,
              height: 14,
              decoration: BoxDecoration(
                color: isTaxi ? AppColors.dividerGrey : AppColors.primaryYellowDark,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
              ),
            ),
          ),
          Positioned(
            bottom: 6,
            left: 20,
            child: _Wheel(),
          ),
          Positioned(
            bottom: 6,
            right: 20,
            child: _Wheel(),
          ),
        ],
      ),
    );
  }
}

class _Wheel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.grey.shade600, width: 1),
      ),
    );
  }
}

class PaymentMethodCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color iconColor;
  final double price;
  final bool isSelected;
  final VoidCallback onTap;

  const PaymentMethodCard({
    super.key,
    required this.label,
    required this.icon,
    required this.iconColor,
    required this.price,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primaryYellow : AppColors.dividerGrey,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: iconColor, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '\$${price.toStringAsFixed(2)}',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
