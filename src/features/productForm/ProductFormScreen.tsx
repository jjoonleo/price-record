import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import {
  createProductFormSchema,
  getProductFormDefaults,
  ProductFormValues
} from './schema';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { resolveProductImageSource } from '../../utils/productImage';

type ProductFormScreenProps = {
  isSaving: boolean;
  isLoading: boolean;
  nameLabel: string;
  noteLabel: string;
  imageLabel: string;
  imagePickLibraryLabel: string;
  imageTakePhotoLabel: string;
  imageRemoveLabel: string;
  namePlaceholder: string;
  notePlaceholder: string;
  backLabel: string;
  headerTitle: string;
  submitLabel: string;
  imageUri: string;
  initialValues?: ProductFormValues;
  statusMessage: string | null;
  onSubmit: SubmitHandler<ProductFormValues>;
  onCancel: () => void;
  onPickImageFromLibrary: () => void;
  onTakePhoto: () => void;
  onRemoveImage: () => void;
  saveNameRequiredMessage: string;
  saveNoteTooLongMessage: string;
};

export const ProductFormScreen = ({
  isSaving,
  isLoading,
  nameLabel,
  noteLabel,
  imageLabel,
  imagePickLibraryLabel,
  imageTakePhotoLabel,
  imageRemoveLabel,
  namePlaceholder,
  notePlaceholder,
  backLabel,
  headerTitle,
  submitLabel,
  imageUri,
  initialValues,
  statusMessage,
  onSubmit,
  onCancel,
  onPickImageFromLibrary,
  onTakePhoto,
  onRemoveImage,
  saveNameRequiredMessage,
  saveNoteTooLongMessage
}: ProductFormScreenProps) => {
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(Math.max(width - spacing.md * 2, 0), 420);
  const schema = useMemo(
    () =>
      createProductFormSchema({
        productNameRequired: saveNameRequiredMessage,
        productNoteTooLong: saveNoteTooLongMessage
      }),
    [saveNameRequiredMessage, saveNoteTooLongMessage]
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: initialValues ?? getProductFormDefaults()
  });

  const onInvalidSubmit: SubmitErrorHandler<ProductFormValues> = () => {
    // Field-level errors render inline.
  };

  const submit = handleSubmit(onSubmit, onInvalidSubmit);

  useEffect(() => {
    reset(initialValues ?? getProductFormDefaults());
  }, [initialValues, reset]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <View style={styles.headerWrap}>
          <View style={[styles.headerInner, { width: frameWidth }]}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
            >
              <Text style={styles.backText}>{backLabel}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={[styles.main, { width: frameWidth }]}>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>{imageLabel}</Text>
              <View style={styles.imagePreviewWrap}>
                <Image source={resolveProductImageSource(imageUri)} style={styles.imagePreview} />
              </View>
              <View style={styles.imageActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isLoading || isSaving}
                  onPress={onPickImageFromLibrary}
                  style={({ pressed }) => [
                    styles.imageActionButton,
                    (isLoading || isSaving) && styles.imageActionButtonDisabled,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={styles.imageActionText}>{imagePickLibraryLabel}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isLoading || isSaving}
                  onPress={onTakePhoto}
                  style={({ pressed }) => [
                    styles.imageActionButton,
                    (isLoading || isSaving) && styles.imageActionButtonDisabled,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={styles.imageActionText}>{imageTakePhotoLabel}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isLoading || isSaving || !imageUri.trim()}
                  onPress={onRemoveImage}
                  style={({ pressed }) => [
                    styles.imageActionButton,
                    (isLoading || isSaving || !imageUri.trim()) && styles.imageActionButtonDisabled,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={styles.imageActionText}>{imageRemoveLabel}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{nameLabel}</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    editable={!isLoading}
                    placeholder={namePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    style={styles.input}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name?.message ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{noteLabel}</Text>
              <Controller
                control={control}
                name="note"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    editable={!isLoading}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={colors.textTertiary}
                    placeholder={notePlaceholder}
                    style={[styles.input, styles.noteInput]}
                    textAlignVertical="top"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.note?.message ? <Text style={styles.errorText}>{errors.note.message}</Text> : null}
            </View>

            {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

            <PrimaryButton
              disabled={isSaving || isLoading}
              label={isSaving ? `${submitLabel}...` : submitLabel}
              onPress={() => {
                void submit();
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  headerWrap: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs
  },
  headerInner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40
  },
  headerAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64
  },
  backText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700'
  },
  headerSpacer: {
    minWidth: 64
  },
  main: {
    marginHorizontal: 'auto',
    marginTop: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    padding: spacing.md
  },
  field: {
    marginBottom: spacing.md
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginBottom: spacing.xs,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24,
    minHeight: 48,
    padding: spacing.sm
  },
  imagePreviewWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 160,
    overflow: 'hidden',
    paddingVertical: spacing.sm
  },
  imagePreview: {
    borderRadius: radius.sm,
    height: 132,
    width: 132
  },
  imageActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  imageActionButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  imageActionButtonDisabled: {
    opacity: 0.45
  },
  imageActionText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '600'
  },
  noteInput: {
    minHeight: 110
  },
  errorText: {
    color: colors.warning,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs
  },
  statusText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.85
  }
});
