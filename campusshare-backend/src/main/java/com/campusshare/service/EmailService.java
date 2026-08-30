package com.campusshare.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username:}") private String fromEmail;
    @Value("${app.frontend-url:http://localhost:5173}") private String frontendUrl;
    @Value("${app.mail-enabled:false}") private boolean mailEnabled;

    private void send(String to,String subject,String body){
        if(!mailEnabled) return;
        SimpleMailMessage m=new SimpleMailMessage();
        if(fromEmail!=null&&!fromEmail.isBlank()) m.setFrom(fromEmail);
        m.setTo(to);m.setSubject(subject);m.setText(body);mailSender.send(m);
    }
    public void sendVerificationEmail(String to,String token){
        send(to,"Verify your CampusShare account","Welcome to CampusShare!\n\nVerify your college email:\n"+frontendUrl+"/verify-email?token="+token+"\n\nThis link expires in 24 hours.");
    }
    public void sendPasswordResetEmail(String to,String token){
        send(to,"Reset your CampusShare password","Reset your password using this secure link:\n"+frontendUrl+"/reset-password?token="+token+"\n\nIf you did not request this, ignore this email.");
    }
    public void sendRentalRequestNotification(String to,String item,String borrower){
        send(to,"New rental request on CampusShare",borrower+" requested to rent “"+item+"”. Open CampusShare to accept or decline it.");
    }
}
