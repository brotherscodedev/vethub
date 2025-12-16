/*
  # Add simplified prescription fields
  
  1. Changes
    - Add direct medication fields to prescriptions table
    - Add prescribed_at field for prescription date
    - These fields make it easier to create simple prescriptions without the complexity of prescription_items
    
  2. Fields Added
    - medication: Name of the medication
    - dosage: Dosage information (e.g., "10mg", "2 comprimidos")
    - frequency: Frequency of administration (e.g., "A cada 8 horas")
    - duration: Duration of treatment (e.g., "7 dias")
    - instructions: Additional instructions
    - prescribed_at: Date of prescription (with default now())
*/

-- Add simplified fields to prescriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'medication'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN medication text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'dosage'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN dosage text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN frequency text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'duration'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN duration text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'instructions'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'prescribed_at'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN prescribed_at timestamptz DEFAULT now();
  END IF;
END $$;
