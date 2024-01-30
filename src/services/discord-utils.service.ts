import { Injectable } from '@nestjs/common';
import { User } from 'discord.js';

interface EventDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

@Injectable()
export class DiscordUtilsService {
  async getUserId(User: User) {
    return User.id;
  }

  async createEventDateFromTimestamp(timestamp: number): Promise<EventDate> {
    const date = new Date(timestamp);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };
  }
}
