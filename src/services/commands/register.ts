import { SlashCommandBuilder } from 'discord.js';

export const RegisterCommand = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Register to the bot')
  .toJSON();
