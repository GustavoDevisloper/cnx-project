import React, { useState, useEffect } from 'react';
import { Button, Card, TextInput, Textarea } from '@tremor/react';
import { WhatsAppContact } from './WhatsAppContactsList';

interface WhatsAppContactFormProps {
  onSave: (contact: Omit<WhatsAppContact, 'id'>) => void;
  onCancel: () => void;
  initialContact?: WhatsAppContact;
  isSubmitting?: boolean;
}

const WhatsAppContactForm: React.FC<WhatsAppContactFormProps> = ({
  onSave,
  onCancel,
  initialContact,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    notes: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (initialContact) {
      setFormData({
        name: initialContact.name || '',
        phoneNumber: initialContact.phoneNumber || '',
        email: initialContact.email || '',
        notes: initialContact.notes || ''
      });
    }
  }, [initialContact]);

  const validateForm = () => {
    const newErrors = {
      name: '',
      phoneNumber: '',
    };
    
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Número de telefone é obrigatório';
      isValid = false;
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phoneNumber.replace(/\s+/g, ''))) {
      newErrors.phoneNumber = 'Número de telefone inválido (use formato internacional)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome*
        </label>
        <TextInput
          id="name"
          name="name"
          placeholder="Nome do contato"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          errorMessage={errors.name}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Número do WhatsApp*
        </label>
        <TextInput
          id="phoneNumber"
          name="phoneNumber"
          placeholder="+5511999999999"
          value={formData.phoneNumber}
          onChange={handleChange}
          error={!!errors.phoneNumber}
          errorMessage={errors.phoneNumber}
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500">
          Formato internacional com código do país (ex: +5511999999999)
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <TextInput
          id="email"
          name="email"
          type="email"
          placeholder="email@exemplo.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Adicione observações sobre este contato"
          value={formData.notes}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {initialContact ? 'Atualizar Contato' : 'Adicionar Contato'}
        </Button>
      </div>
    </form>
  );
};

export default WhatsAppContactForm; 