class LocationModel {
  final double lat;
  final double lng;
  final String address;

  const LocationModel({
    required this.lat,
    required this.lng,
    required this.address,
  });

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng};

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      address: json['address'] as String? ?? '',
    );
  }
}

class SuggestionModel {
  final String id;
  final String name;
  final String address;
  final double lat;
  final double lng;

  const SuggestionModel({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
  });

  factory SuggestionModel.fromJson(Map<String, dynamic> json) {
    return SuggestionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );
  }
}

class RideOptionModel {
  final String id;
  final String name;
  final String description;
  final double basePrice;
  final String vehicleType;

  const RideOptionModel({
    required this.id,
    required this.name,
    required this.description,
    required this.basePrice,
    required this.vehicleType,
  });

  factory RideOptionModel.fromJson(Map<String, dynamic> json) {
    return RideOptionModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      basePrice: (json['basePrice'] as num).toDouble(),
      vehicleType: json['vehicleType'] as String? ?? 'sedan',
    );
  }
}

class DriverModel {
  final String id;
  final String name;
  final String vehicle;
  final String licensePlate;
  final double rating;

  const DriverModel({
    required this.id,
    required this.name,
    required this.vehicle,
    required this.licensePlate,
    required this.rating,
  });

  factory DriverModel.fromJson(Map<String, dynamic> json) {
    return DriverModel(
      id: json['id'] as String,
      name: json['name'] as String,
      vehicle: json['vehicle'] as String,
      licensePlate: json['licensePlate'] as String,
      rating: (json['rating'] as num).toDouble(),
    );
  }
}

class RideModel {
  final String id;
  final String status;
  final LocationModel pickup;
  final LocationModel destination;
  final String rideType;
  final String paymentMethod;
  final double price;
  final DriverModel? driver;

  const RideModel({
    required this.id,
    required this.status,
    required this.pickup,
    required this.destination,
    required this.rideType,
    required this.paymentMethod,
    required this.price,
    this.driver,
  });

  factory RideModel.fromJson(Map<String, dynamic> json) {
    return RideModel(
      id: json['id'] as String,
      status: json['status'] as String,
      pickup: LocationModel(
        lat: (json['pickup']['lat'] as num).toDouble(),
        lng: (json['pickup']['lng'] as num).toDouble(),
        address: json['pickupAddress'] as String? ?? '',
      ),
      destination: LocationModel(
        lat: (json['destination']['lat'] as num).toDouble(),
        lng: (json['destination']['lng'] as num).toDouble(),
        address: json['destinationAddress'] as String? ?? '',
      ),
      rideType: json['rideType'] as String,
      paymentMethod: json['paymentMethod'] as String,
      price: (json['price'] as num).toDouble(),
      driver: json['driver'] != null
          ? DriverModel.fromJson(json['driver'] as Map<String, dynamic>)
          : null,
    );
  }
}

class TripTrackModel {
  final String rideId;
  final String status;
  final DriverModel driver;
  final int etaMinutes;

  const TripTrackModel({
    required this.rideId,
    required this.status,
    required this.driver,
    required this.etaMinutes,
  });

  factory TripTrackModel.fromJson(Map<String, dynamic> json) {
    return TripTrackModel(
      rideId: json['rideId'] as String,
      status: json['status'] as String,
      driver: DriverModel.fromJson(json['driver'] as Map<String, dynamic>),
      etaMinutes: json['etaMinutes'] as int? ?? 0,
    );
  }
}

class PricingModel {
  final double ridePrice;
  final double paymentFee;
  final double total;

  const PricingModel({
    required this.ridePrice,
    required this.paymentFee,
    required this.total,
  });

  factory PricingModel.fromJson(Map<String, dynamic> json) {
    return PricingModel(
      ridePrice: (json['ridePrice'] as num).toDouble(),
      paymentFee: (json['paymentFee'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
    );
  }
}
