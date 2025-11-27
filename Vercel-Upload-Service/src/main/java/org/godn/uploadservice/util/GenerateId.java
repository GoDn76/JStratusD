package org.godn.uploadservice.util;

public class GenerateId {
    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int ID_LENGTH = 5;

    public static String create() {
        StringBuilder id = new StringBuilder(ID_LENGTH);
        for (int i = 0; i < ID_LENGTH; i++) {
            int index = (int) (Math.random() * ALPHABET.length());
            id.append(ALPHABET.charAt(index));
        }
        return id.toString();
    }

    public static String create(int ID_LENGTH){
        StringBuilder id = new StringBuilder(ID_LENGTH);
        for (int i = 0; i < ID_LENGTH; i++) {
            int index = (int) (Math.random() * ALPHABET.length());
            id.append(ALPHABET.charAt(index));
        }
        return id.toString();
    }
}
