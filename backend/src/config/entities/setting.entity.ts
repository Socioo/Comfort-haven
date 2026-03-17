import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
    @PrimaryColumn()
    key: string;

    @Column('text')
    value: string;

    @Column({ default: 'string' })
    type: string; // 'string', 'number', 'boolean', 'json'

    @UpdateDateColumn()
    updatedAt: Date;
}
